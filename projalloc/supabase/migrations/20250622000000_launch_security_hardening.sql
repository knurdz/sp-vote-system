-- Launch security hardening for live voting.
-- Keeps teams free to vote on multiple open projects, but removes all other
-- votes after a team wins a project.

-- ---------------------------------------------------------------------------
-- Normalize direct API writes and prevent forged vote timestamps.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.normalize_vote_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.leader_email := lower(trim(NEW.leader_email));
  NEW.voted_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS normalize_vote_insert_before ON public.votes;
CREATE TRIGGER normalize_vote_insert_before
  BEFORE INSERT ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_vote_insert();

CREATE OR REPLACE FUNCTION public.normalize_team_write()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.name := trim(NEW.name);
  NEW.leader_email := lower(trim(NEW.leader_email));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS normalize_team_write_before ON public.teams;
CREATE TRIGGER normalize_team_write_before
  BEFORE INSERT OR UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_team_write();

-- ---------------------------------------------------------------------------
-- DB-level input constraints. NOT VALID avoids breaking deployment on old data
-- while still enforcing the constraints for new and changed rows.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_title_length_check'
  ) THEN
    ALTER TABLE public.projects
      ADD CONSTRAINT projects_title_length_check
      CHECK (length(btrim(title)) BETWEEN 3 AND 100) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_company_length_check'
  ) THEN
    ALTER TABLE public.projects
      ADD CONSTRAINT projects_company_length_check
      CHECK (length(btrim(company)) BETWEEN 2 AND 80) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_description_length_check'
  ) THEN
    ALTER TABLE public.projects
      ADD CONSTRAINT projects_description_length_check
      CHECK (length(btrim(description)) BETWEEN 10 AND 2000) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_team_size_check'
  ) THEN
    ALTER TABLE public.projects
      ADD CONSTRAINT projects_team_size_check
      CHECK (team_size BETWEEN 1 AND 20) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'teams_name_length_check'
  ) THEN
    ALTER TABLE public.teams
      ADD CONSTRAINT teams_name_length_check
      CHECK (length(btrim(name)) BETWEEN 2 AND 60) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'teams_leader_email_format_check'
  ) THEN
    ALTER TABLE public.teams
      ADD CONSTRAINT teams_leader_email_format_check
      CHECK (leader_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'spin_events_zoom_link_check'
  ) THEN
    ALTER TABLE public.spin_events
      ADD CONSTRAINT spin_events_zoom_link_check
      CHECK (
        zoom_link IS NULL
        OR zoom_link ~ '^https://(zoom\.us/|us[0-9]+\.zoom\.us/)'
      ) NOT VALID;
  END IF;
END;
$$;

-- One immutable audit record per spin event.
CREATE UNIQUE INDEX IF NOT EXISTS ux_spin_logs_spin_event_id
  ON public.spin_logs(spin_event_id);

-- ---------------------------------------------------------------------------
-- Votes: allow many active project votes, but only before the DB deadline.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Leaders can insert votes" ON public.votes;
CREATE POLICY "Leaders can insert votes" ON public.votes
  FOR INSERT
  WITH CHECK (
    public.is_leader()
    AND leader_email = auth.jwt() ->> 'email'
    AND EXISTS (
      SELECT 1 FROM public.teams
      WHERE leader_email = auth.jwt() ->> 'email'
        AND id = team_id
    )
    AND EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_id
        AND status = 'voting'
        AND voting_deadline > now()
    )
    AND NOT public.team_is_assigned(team_id)
  );

DROP POLICY IF EXISTS "Leaders can delete own votes" ON public.votes;
CREATE POLICY "Leaders can delete own votes" ON public.votes
  FOR DELETE
  USING (
    leader_email = auth.jwt() ->> 'email'
    AND EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_id
        AND status = 'voting'
        AND voting_deadline > now()
    )
  );

DROP POLICY IF EXISTS "Anyone can view votes on closed projects" ON public.votes;
CREATE POLICY "Anyone can view votes on closed projects" ON public.votes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_id
        AND status IN ('closed', 'assigned')
    )
  );

-- Public project detail pages show vote distribution only after voting closes.
-- RLS above still prevents anonymous access to live voting rows.
GRANT SELECT ON public.votes TO anon;

-- If a spin event is locked by any admin path, discard that team's other votes.
CREATE OR REPLACE FUNCTION public.discard_other_votes_for_winner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.winning_team_id IS NOT NULL AND NEW.spun_at IS NOT NULL THEN
    DELETE FROM public.votes
    WHERE team_id = NEW.winning_team_id
      AND project_id <> NEW.project_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS discard_other_votes_for_winner_after ON public.spin_events;
CREATE TRIGGER discard_other_votes_for_winner_after
  AFTER INSERT OR UPDATE OF winning_team_id, spun_at ON public.spin_events
  FOR EACH ROW
  EXECUTE FUNCTION public.discard_other_votes_for_winner();

-- ---------------------------------------------------------------------------
-- Atomic server-side spin lock.
-- Chooses the winner in the database, writes the audit log, assigns the
-- project, and discards the winning team's other votes in one transaction.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.lock_spin_result(p_project_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project public.projects%ROWTYPE;
  v_event public.spin_events%ROWTYPE;
  v_log_id uuid;
  v_winner_id uuid;
  v_winner_name text;
  v_candidates jsonb;
  v_candidate_count integer;
  v_removed_votes integer := 0;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT *
  INTO v_project
  FROM public.projects
  WHERE id = p_project_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  IF v_project.status = 'assigned' THEN
    RAISE EXCEPTION 'Project is already assigned';
  END IF;

  IF v_project.status = 'voting' THEN
    IF v_project.voting_deadline > now() THEN
      RAISE EXCEPTION 'Voting is still open';
    END IF;

    UPDATE public.projects
    SET status = 'closed'
    WHERE id = p_project_id
    RETURNING * INTO v_project;
  ELSIF v_project.status <> 'closed' THEN
    RAISE EXCEPTION 'Project must be closed before spinning';
  END IF;

  SELECT count(*)
  INTO v_candidate_count
  FROM public.votes
  WHERE project_id = p_project_id;

  IF v_candidate_count = 0 THEN
    RAISE EXCEPTION 'No votes found for this project';
  END IF;

  SELECT se.*
  INTO v_event
  FROM public.spin_events se
  WHERE se.project_id = p_project_id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.spin_events (project_id)
    VALUES (p_project_id)
    RETURNING * INTO v_event;
  END IF;

  IF v_event.spun_at IS NOT NULL
    OR EXISTS (SELECT 1 FROM public.spin_logs WHERE spin_event_id = v_event.id)
  THEN
    RAISE EXCEPTION 'Result already recorded';
  END IF;

  SELECT t.id, t.name
  INTO v_winner_id, v_winner_name
  FROM public.votes v
  INNER JOIN public.teams t ON t.id = v.team_id
  WHERE v.project_id = p_project_id
  ORDER BY gen_random_uuid()
  LIMIT 1;

  IF v_winner_id IS NULL THEN
    RAISE EXCEPTION 'Could not select a winner';
  END IF;

  IF public.team_is_assigned(v_winner_id) THEN
    RAISE EXCEPTION 'Selected team is already assigned elsewhere';
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object('team_id', t.id, 'team_name', t.name)
    ORDER BY v.voted_at, t.name
  )
  INTO v_candidates
  FROM public.votes v
  INNER JOIN public.teams t ON t.id = v.team_id
  WHERE v.project_id = p_project_id;

  INSERT INTO public.spin_logs (
    spin_event_id,
    all_candidates,
    winning_team_name,
    project_title,
    company
  )
  VALUES (
    v_event.id,
    COALESCE(v_candidates, '[]'::jsonb),
    v_winner_name,
    v_project.title,
    v_project.company
  )
  RETURNING id INTO v_log_id;

  UPDATE public.spin_events
  SET
    spun_at = now(),
    winning_team_id = v_winner_id,
    triggered_by = auth.uid()
  WHERE id = v_event.id
  RETURNING * INTO v_event;

  UPDATE public.projects
  SET status = 'assigned'
  WHERE id = p_project_id;

  DELETE FROM public.votes
  WHERE team_id = v_winner_id
    AND project_id <> p_project_id;
  GET DIAGNOSTICS v_removed_votes = ROW_COUNT;

  RETURN jsonb_build_object(
    'spin_event_id', v_event.id,
    'spin_log_id', v_log_id,
    'winning_team_id', v_winner_id,
    'winning_team_name', v_winner_name,
    'removed_other_votes', v_removed_votes
  );
END;
$$;

REVOKE ALL ON FUNCTION public.lock_spin_result(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lock_spin_result(uuid) TO authenticated;

-- Production-safe delete: allow cleanup before a spin is locked, but preserve
-- immutable audit records once real allocation results exist.
CREATE OR REPLACE FUNCTION public.admin_delete_project(p_project_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.projects WHERE id = p_project_id) THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.spin_logs sl
    INNER JOIN public.spin_events se ON se.id = sl.spin_event_id
    WHERE se.project_id = p_project_id
  ) THEN
    RAISE EXCEPTION 'Cannot delete a project with a locked spin result';
  END IF;

  DELETE FROM public.spin_events WHERE project_id = p_project_id;
  DELETE FROM public.votes WHERE project_id = p_project_id;
  DELETE FROM public.projects WHERE id = p_project_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_project(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_project(uuid) TO authenticated;
