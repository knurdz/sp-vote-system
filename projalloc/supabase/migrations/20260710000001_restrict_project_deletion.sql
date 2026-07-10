-- Restrict delete policy on projects to only allow thesarupraneeth@gmail.com
DROP POLICY IF EXISTS "Admins can delete projects" ON public.projects;

CREATE POLICY "Only thesarupraneeth@gmail.com can delete projects"
ON public.projects
FOR DELETE
TO authenticated
USING (
  (auth.jwt() ->> 'email') = 'thesarupraneeth@gmail.com'
);
