-- Add gnanaweerakmk@gmail.com to the admin_emails whitelist table
INSERT INTO public.admin_emails (email)
VALUES ('gnanaweerakmk@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- If the user has already signed up, immediately upgrade their profile role to admin
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'gnanaweerakmk@gmail.com';
