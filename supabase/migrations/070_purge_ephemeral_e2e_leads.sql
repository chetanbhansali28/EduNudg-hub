-- Permanently delete ephemeral E2E student leads (email / name patterns).
-- Clears students.source_lead_id (non-CASCADE) before DELETE FROM leads.
-- lead_events / lead_assignment_history cascade from leads.

CREATE OR REPLACE FUNCTION public.purge_ephemeral_e2e_leads()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead_ids uuid[];
  v_leads_deleted int := 0;
  v_students_unlinked int := 0;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT COALESCE(array_agg(l.id), ARRAY[]::uuid[])
  INTO v_lead_ids
  FROM public.leads l
  WHERE
    l.email ~* '^e2e-lead-.+@example\.com$'
    OR l.email ~* '^(path-a-|path-b-|lost-|merge-|stale-|manual-).+@example\.com$'
    OR l.parent_name ~* '^E2E Parent\b'
    OR l.child_name ~* '^E2E Child\b'
    OR l.parent_name IN (
      'Path A Parent', 'Path B Parent', 'Lost Parent', 'Merge Parent',
      'Stale Parent', 'Manual Brand Parent', 'Neg Parent'
    )
    OR l.child_name ~* '^(CenterChild|LostChild|StaleChild|ManualChild|Merge Child|Neg Child)\b'
    OR l.child_name ~* '^Child [a-z0-9]+$';

  IF cardinality(v_lead_ids) > 0 THEN
    UPDATE public.students
    SET source_lead_id = NULL, updated_at = now()
    WHERE source_lead_id = ANY (v_lead_ids);
    GET DIAGNOSTICS v_students_unlinked = ROW_COUNT;

    DELETE FROM public.leads WHERE id = ANY (v_lead_ids);
    GET DIAGNOSTICS v_leads_deleted = ROW_COUNT;
  END IF;

  RETURN jsonb_build_object(
    'leads_deleted', v_leads_deleted,
    'students_unlinked', v_students_unlinked
  );
END;
$$;

REVOKE ALL ON FUNCTION public.purge_ephemeral_e2e_leads() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.purge_ephemeral_e2e_leads() TO authenticated, service_role;
