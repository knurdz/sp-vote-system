-- Idempotent security hardening (safe to re-run after partial 006 failures)
-- Run this entire script in Supabase SQL Editor.

-- ---------------------------------------------------------------------------
-- Prerequisite helper functions
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_leader()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'leader'
  );
$$;

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

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role TEXT := 'viewer';
BEGIN
  IF EXISTS (SELECT 1 FROM public.admin_emails WHERE email = NEW.email) THEN
    assigned_role := 'admin';
  ELSIF EXISTS (SELECT 1 FROM public.teams WHERE leader_email = NEW.email) THEN
    assigned_role := 'leader';
  END IF;

  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, assigned_role);

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- admin_emails: block all frontend access
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can read admin emails" ON public.admin_emails;
DROP POLICY IF EXISTS "No public access to admin_emails" ON public.admin_emails;

CREATE POLICY "No public access to admin_emails" ON public.admin_emails
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- ---------------------------------------------------------------------------
-- profiles: no self-service writes
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "No direct profile inserts" ON public.profiles;
DROP POLICY IF EXISTS "Users cannot update own profile" ON public.profiles;

CREATE POLICY "No direct profile inserts" ON public.profiles
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Users cannot update own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (false);

CREATE POLICY "Admins can update profiles" ON public.profiles
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- votes: leader must match JWT email and registered team
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
      WHERE id = project_id AND status = 'voting'
    )
    AND NOT public.team_is_assigned(team_id)
  );

-- ---------------------------------------------------------------------------
-- spin_logs: immutable audit trail
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can insert spin logs" ON public.spin_logs;
DROP POLICY IF EXISTS "Anyone can view spin logs" ON public.spin_logs;

CREATE POLICY "Anyone can view spin logs" ON public.spin_logs
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert spin logs" ON public.spin_logs
  FOR INSERT
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- Table privileges (RLS enforces row access)
-- ---------------------------------------------------------------------------
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;

GRANT SELECT ON public.projects TO anon;
GRANT SELECT ON public.teams TO anon;
GRANT SELECT ON public.spin_events TO anon;
GRANT SELECT ON public.spin_logs TO anon;

GRANT SELECT ON public.projects TO authenticated;
GRANT SELECT ON public.teams TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.spin_events TO authenticated;
GRANT SELECT ON public.spin_logs TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.votes TO authenticated;

GRANT INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.spin_events TO authenticated;
GRANT INSERT ON public.spin_logs TO authenticated;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_votes_project_id ON public.votes(project_id);
CREATE INDEX IF NOT EXISTS idx_votes_leader_email ON public.votes(leader_email);
CREATE INDEX IF NOT EXISTS idx_votes_team_id ON public.votes(team_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
