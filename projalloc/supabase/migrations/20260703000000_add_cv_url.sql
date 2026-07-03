-- Database migration to add CV upload timeline, CV storage bucket, and voting restrictions.

-- 1. Add cv_url to public.teams
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS cv_url TEXT;

-- 2. Create settings table for global timeline settings
CREATE TABLE IF NOT EXISTS public.settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  cv_upload_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cv_upload_deadline TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Insert default settings row if it doesn't exist
INSERT INTO public.settings (id, cv_upload_start, cv_upload_deadline)
VALUES (1, NOW(), NOW() + INTERVAL '7 days')
ON CONFLICT (id) DO NOTHING;

-- 4. Enable RLS on settings table
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view settings" ON public.settings;
CREATE POLICY "Anyone can view settings" ON public.settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage settings" ON public.settings;
CREATE POLICY "Admins can manage settings" ON public.settings
  FOR ALL USING (public.is_admin());

-- Helper functions with SECURITY DEFINER to bypass nested RLS constraints safely

CREATE OR REPLACE FUNCTION public.get_user_team_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_team_id uuid;
BEGIN
  SELECT t.id INTO v_team_id
  FROM public.teams t
  JOIN public.profiles p ON lower(p.email) = lower(t.leader_email)
  WHERE p.id = auth.uid();
  
  RETURN v_team_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_cv_upload_open()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_open boolean;
BEGIN
  SELECT (NOW() >= cv_upload_start AND NOW() <= cv_upload_deadline) INTO v_open
  FROM public.settings
  WHERE id = 1;
  
  RETURN COALESCE(v_open, false);
END;
$$;

-- 5. Add RLS policy for team leaders to update their own team data (like cv_url)
DROP POLICY IF EXISTS "Leaders can update own team" ON public.teams;
CREATE POLICY "Leaders can update own team" ON public.teams
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'leader'
      AND lower(p.email) = lower(leader_email)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'leader'
      AND lower(p.email) = lower(leader_email)
    )
  );

-- 6. Insert cvs storage bucket (private by default)
INSERT INTO storage.buckets (id, name, public)
VALUES ('cvs', 'cvs', false)
ON CONFLICT (id) DO NOTHING;

-- 7. Configure storage policies on storage.objects for the 'cvs' bucket
DROP POLICY IF EXISTS "Admins can do everything on CVs" ON storage.objects;
CREATE POLICY "Admins can do everything on CVs" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'cvs' AND public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'cvs' AND public.is_admin()
  );

DROP POLICY IF EXISTS "Leaders can read own team CV" ON storage.objects;
CREATE POLICY "Leaders can read own team CV" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'cvs' AND (
      (storage.foldername(name))[1] = public.get_user_team_id()::text
      OR split_part(trim(leading '/' from name), '/', 1) = public.get_user_team_id()::text
    )
  );

DROP POLICY IF EXISTS "Leaders can upload own team CV" ON storage.objects;
CREATE POLICY "Leaders can upload own team CV" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'cvs' AND (
      (storage.foldername(name))[1] = public.get_user_team_id()::text
      OR split_part(trim(leading '/' from name), '/', 1) = public.get_user_team_id()::text
    )
    AND public.is_cv_upload_open()
  );

DROP POLICY IF EXISTS "Leaders can update own team CV" ON storage.objects;
CREATE POLICY "Leaders can update own team CV" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'cvs' AND (
      (storage.foldername(name))[1] = public.get_user_team_id()::text
      OR split_part(trim(leading '/' from name), '/', 1) = public.get_user_team_id()::text
    )
    AND public.is_cv_upload_open()
  );

DROP POLICY IF EXISTS "Leaders can delete own team CV" ON storage.objects;
CREATE POLICY "Leaders can delete own team CV" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'cvs' AND (
      (storage.foldername(name))[1] = public.get_user_team_id()::text
      OR split_part(trim(leading '/' from name), '/', 1) = public.get_user_team_id()::text
    )
    AND public.is_cv_upload_open()
  );

-- 8. Restrict voting: Only allowed after the CV deadline has passed, and only if team has uploaded their CV
DROP POLICY IF EXISTS "Leaders can insert votes" ON public.votes;
CREATE POLICY "Leaders can insert votes" ON public.votes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.teams t ON lower(t.leader_email) = lower(p.email)
      WHERE p.id = auth.uid()
      AND p.role = 'leader'
      AND t.id = team_id
      AND t.cv_url IS NOT NULL
    )
    -- Ensure voting occurs after the CV upload deadline
    AND NOW() > (SELECT cv_upload_deadline FROM public.settings WHERE id = 1)
    -- Standard project checks
    AND EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_id
        AND status = 'voting'
        AND voting_deadline > now()
    )
    AND NOT public.team_is_assigned(team_id)
  );
