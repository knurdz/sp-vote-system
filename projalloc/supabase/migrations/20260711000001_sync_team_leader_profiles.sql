-- If a user logs in before their team is created, their profile starts as viewer.
-- Promote matching existing profiles when teams are added or edited.
UPDATE public.profiles p
SET role = 'leader'
FROM public.teams t
WHERE p.role = 'viewer'
  AND lower(p.email) = lower(t.leader_email);

CREATE OR REPLACE FUNCTION public.sync_team_leader_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET role = 'leader'
  WHERE role = 'viewer'
    AND lower(email) = lower(NEW.leader_email);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_team_leader_profile_role_after ON public.teams;
CREATE TRIGGER sync_team_leader_profile_role_after
  AFTER INSERT OR UPDATE OF leader_email ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_team_leader_profile_role();
