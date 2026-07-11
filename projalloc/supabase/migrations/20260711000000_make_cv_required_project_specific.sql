-- CV uploads gate only projects marked CV Required.
DROP POLICY IF EXISTS "Leaders can insert votes" ON public.votes;
CREATE POLICY "Leaders can insert votes" ON public.votes
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.teams t ON lower(t.leader_email) = lower(p.email)
      JOIN public.projects pr ON pr.id = project_id
      WHERE p.id = auth.uid()
        AND p.role = 'leader'
        AND t.id = team_id
        AND pr.status = 'voting'
        AND pr.voting_deadline > now()
        AND (NOT pr.cv_required OR t.cv_url IS NOT NULL)
    )
    AND NOT public.team_is_assigned(team_id)
  );
