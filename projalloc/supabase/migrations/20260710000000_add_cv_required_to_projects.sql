-- Add cv_required column to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS cv_required BOOLEAN NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------------
-- Atomic manual team assignment for CV Required projects.
-- Matches a team to a project, marks it as assigned, creates audit log entries,
-- and discards other votes of the winning team.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.assign_project_manually(p_project_id uuid, p_team_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project public.projects%ROWTYPE;
  v_team public.teams%ROWTYPE;
  v_event public.spin_events%ROWTYPE;
  v_log_id uuid;
  v_removed_votes integer := 0;
  v_candidates jsonb;
BEGIN
  -- Authenticate admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- 1. Lock project row
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

  IF NOT v_project.cv_required THEN
    RAISE EXCEPTION 'Project does not support manual CV assignment';
  END IF;

  -- 2. Lock team row
  SELECT *
  INTO v_team
  FROM public.teams
  WHERE id = p_team_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Team not found';
  END IF;

  -- Verify team has voted for this project
  IF NOT EXISTS (
    SELECT 1 FROM public.votes 
    WHERE project_id = p_project_id AND team_id = p_team_id
  ) THEN
    RAISE EXCEPTION 'Selected team did not vote for this project';
  END IF;

  -- Verify team is not already assigned
  IF public.team_is_assigned(p_team_id) THEN
    RAISE EXCEPTION 'Selected team is already assigned to another project';
  END IF;

  -- 3. Transition status to closed if it was voting
  IF v_project.status = 'voting' THEN
    UPDATE public.projects
    SET status = 'closed'
    WHERE id = p_project_id
    RETURNING * INTO v_project;
  END IF;

  -- 4. Get or create spin event
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
    RAISE EXCEPTION 'Result already recorded for this project';
  END IF;

  -- 5. Collect candidates for audit log
  SELECT jsonb_agg(
    jsonb_build_object('team_id', t.id, 'team_name', t.name)
    ORDER BY v.voted_at, t.name
  )
  INTO v_candidates
  FROM public.votes v
  INNER JOIN public.teams t ON t.id = v.team_id
  WHERE v.project_id = p_project_id;

  -- 6. Insert audit log
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
    v_team.name || ' (Manual Selection)',
    v_project.title,
    v_project.company
  )
  RETURNING id INTO v_log_id;

  -- 7. Record winner on the event
  UPDATE public.spin_events
  SET
    spun_at = now(),
    winning_team_id = p_team_id,
    triggered_by = auth.uid()
  WHERE id = v_event.id
  RETURNING * INTO v_event;

  -- 8. Assign project status
  UPDATE public.projects
  SET status = 'assigned'
  WHERE id = p_project_id;

  -- 9. Delete other votes of the winning team
  DELETE FROM public.votes
  WHERE team_id = p_team_id
    AND project_id <> p_project_id;
  GET DIAGNOSTICS v_removed_votes = ROW_COUNT;

  RETURN jsonb_build_object(
    'spin_event_id', v_event.id,
    'spin_log_id', v_log_id,
    'winning_team_id', p_team_id,
    'removed_votes_count', v_removed_votes
  );
END;
$$;

REVOKE ALL ON FUNCTION public.assign_project_manually(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_project_manually(uuid, uuid) TO authenticated;
