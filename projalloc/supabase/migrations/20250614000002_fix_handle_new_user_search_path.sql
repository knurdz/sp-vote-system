-- Fix: SECURITY DEFINER trigger runs in auth context without public in search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    CASE
      WHEN EXISTS (SELECT 1 FROM public.admin_emails WHERE email = NEW.email) THEN 'admin'
      WHEN EXISTS (SELECT 1 FROM public.teams WHERE leader_email = NEW.email) THEN 'leader'
      ELSE 'viewer'
    END
  );
  RETURN NEW;
END;
$$;
