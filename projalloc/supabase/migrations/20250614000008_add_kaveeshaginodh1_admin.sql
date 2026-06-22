-- Add kaveeshaginodh1@gmail.com to the admin_emails table
INSERT INTO public.admin_emails (email)
VALUES ('kaveeshaginodh1@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- If the user has already signed up and has a profile, upgrade their role to admin
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'kaveeshaginodh1@gmail.com';
