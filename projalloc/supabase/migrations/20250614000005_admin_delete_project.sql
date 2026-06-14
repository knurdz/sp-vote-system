-- Allow admins to fully remove a project and related voting/spin data (e.g. test projects).

CREATE OR REPLACE FUNCTION public.admin_delete_project(p_project_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.projects WHERE id = p_project_id) THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  DELETE FROM public.spin_logs
  WHERE spin_event_id IN (
    SELECT id FROM public.spin_events WHERE project_id = p_project_id
  );

  DELETE FROM public.spin_events WHERE project_id = p_project_id;
  DELETE FROM public.votes WHERE project_id = p_project_id;
  DELETE FROM public.projects WHERE id = p_project_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_project(uuid) TO authenticated;
