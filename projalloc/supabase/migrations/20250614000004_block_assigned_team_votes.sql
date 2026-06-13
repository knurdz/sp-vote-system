-- Teams that have won / been assigned a project cannot vote on other projects

CREATE OR REPLACE FUNCTION public.team_is_assigned(p_team_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.spin_events se
    INNER JOIN public.projects p ON p.id = se.project_id
    WHERE se.winning_team_id = p_team_id
      AND se.spun_at IS NOT NULL
      AND p.status = 'assigned'
  );
$$;

DROP POLICY IF EXISTS "Leaders can insert votes" ON votes;
CREATE POLICY "Leaders can insert votes" ON votes FOR INSERT WITH CHECK (
  public.is_leader()
  AND leader_email = auth.jwt() ->> 'email'
  AND EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = project_id AND status = 'voting'
  )
  AND NOT public.team_is_assigned(team_id)
);
