-- Fix infinite RLS recursion when policies query profiles from within profiles policies

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

-- admin_emails
DROP POLICY IF EXISTS "Admins can read admin emails" ON admin_emails;
CREATE POLICY "Admins can read admin emails" ON admin_emails FOR SELECT USING (public.is_admin());

-- profiles
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
CREATE POLICY "Admins can read all profiles" ON profiles FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
CREATE POLICY "Admins can update profiles" ON profiles FOR UPDATE USING (public.is_admin());

-- projects
DROP POLICY IF EXISTS "Admins can insert projects" ON projects;
CREATE POLICY "Admins can insert projects" ON projects FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update projects" ON projects;
CREATE POLICY "Admins can update projects" ON projects FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete projects" ON projects;
CREATE POLICY "Admins can delete projects" ON projects FOR DELETE USING (public.is_admin());

-- teams
DROP POLICY IF EXISTS "Admins can manage teams" ON teams;
CREATE POLICY "Admins can manage teams" ON teams FOR ALL USING (public.is_admin());

-- votes
DROP POLICY IF EXISTS "Leaders can insert votes" ON votes;
CREATE POLICY "Leaders can insert votes" ON votes FOR INSERT WITH CHECK (
  public.is_leader()
  AND leader_email = auth.jwt() ->> 'email'
  AND EXISTS (SELECT 1 FROM projects WHERE id = project_id AND status = 'voting')
);

DROP POLICY IF EXISTS "Admins can view all votes" ON votes;
CREATE POLICY "Admins can view all votes" ON votes FOR SELECT USING (public.is_admin());

-- spin_events
DROP POLICY IF EXISTS "Admins can manage spin events" ON spin_events;
CREATE POLICY "Admins can manage spin events" ON spin_events FOR ALL USING (public.is_admin());

-- spin_logs
DROP POLICY IF EXISTS "Admins can insert spin logs" ON spin_logs;
CREATE POLICY "Admins can insert spin logs" ON spin_logs FOR INSERT WITH CHECK (public.is_admin());
