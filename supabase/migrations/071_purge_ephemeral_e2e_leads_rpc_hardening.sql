-- Harden ephemeral E2E lead purge: wider matchers + brand-scoped RPC for E2E cleanup
-- when DATABASE_URL is unavailable (Playwright signs in as brand/platform and calls RPC).

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
  v_students_deleted int := 0;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT COALESCE(array_agg(l.id), ARRAY[]::uuid[])
  INTO v_lead_ids
  FROM public.leads l
  WHERE
    l.email ~* '^e2e-lead-.+@example\.com$'
    OR l.email ~* '^(path-a-|path-b-|lost-|merge-|stale-|manual-|neg-).+@example\.com$'
    OR l.email ~* '@example\.com$' AND (
      l.parent_name ~* '^E2E Parent\b'
      OR l.child_name ~* '^E2E Child\b'
      OR l.full_name ~* '^E2E (Parent|Child)\b'
    )
    OR l.parent_name ~* '^E2E Parent\b'
    OR l.child_name ~* '^E2E Child\b'
    OR l.full_name ~* '^E2E (Parent|Child)\b'
    OR l.parent_name IN (
      'Path A Parent', 'Path B Parent', 'Lost Parent', 'Merge Parent',
      'Stale Parent', 'Manual Brand Parent', 'Neg Parent'
    )
    OR l.child_name ~* '^(CenterChild|LostChild|StaleChild|ManualChild|Merge Child|Neg Child)\b'
    OR l.child_name ~* '^Child [a-z0-9]+$'
    OR l.full_name ~* '^(CenterChild|LostChild|StaleChild|ManualChild|Merge Child|Neg Child|Path A Parent|Path B Parent)\b';

  IF cardinality(v_lead_ids) > 0 THEN
    UPDATE public.students
    SET source_lead_id = NULL, updated_at = now()
    WHERE source_lead_id = ANY (v_lead_ids);
    GET DIAGNOSTICS v_students_unlinked = ROW_COUNT;

    DELETE FROM public.leads WHERE id = ANY (v_lead_ids);
    GET DIAGNOSTICS v_leads_deleted = ROW_COUNT;
  END IF;

  -- Remove converted E2E child rows left on seed brands after lead purge.
  BEGIN
    DELETE FROM public.transfer_requests
    WHERE student_id IN (
      SELECT s.id FROM public.students s
      JOIN public.brands b ON b.id = s.brand_id
      WHERE b.slug IN ('abacusworld', 'smart-brain-abacus')
        AND (
          s.full_name ~* '^E2E Child\b'
          OR s.full_name ~* '^(CenterChild|LostChild|StaleChild|ManualChild|Merge Child)\b'
          OR s.full_name ~* '^Child [a-z0-9]+$'
          OR coalesce(s.login_email, '') ~* '^e2e-lead-.+@example\.com$'
        )
    );

    DELETE FROM public.students s
    USING public.brands b
    WHERE s.brand_id = b.id
      AND b.slug IN ('abacusworld', 'smart-brain-abacus')
      AND (
        s.full_name ~* '^E2E Child\b'
        OR s.full_name ~* '^(CenterChild|LostChild|StaleChild|ManualChild|Merge Child)\b'
        OR s.full_name ~* '^Child [a-z0-9]+$'
        OR coalesce(s.login_email, '') ~* '^e2e-lead-.+@example\.com$'
      );
    GET DIAGNOSTICS v_students_deleted = ROW_COUNT;
  EXCEPTION
    WHEN foreign_key_violation THEN
      v_students_deleted := 0;
  END;

  RETURN jsonb_build_object(
    'leads_deleted', v_leads_deleted,
    'students_unlinked', v_students_unlinked,
    'students_deleted', v_students_deleted
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.purge_ephemeral_e2e_leads_for_brand(p_brand_id uuid)
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
  IF auth.uid() IS NOT NULL
     AND NOT public.is_platform_admin()
     AND NOT public.has_brand_access(p_brand_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT COALESCE(array_agg(l.id), ARRAY[]::uuid[])
  INTO v_lead_ids
  FROM public.leads l
  WHERE l.brand_id = p_brand_id
    AND (
      l.email ~* '^e2e-lead-.+@example\.com$'
      OR l.email ~* '^(path-a-|path-b-|lost-|merge-|stale-|manual-|neg-).+@example\.com$'
      OR l.parent_name ~* '^E2E Parent\b'
      OR l.child_name ~* '^E2E Child\b'
      OR l.full_name ~* '^E2E (Parent|Child)\b'
      OR l.parent_name IN (
        'Path A Parent', 'Path B Parent', 'Lost Parent', 'Merge Parent',
        'Stale Parent', 'Manual Brand Parent', 'Neg Parent'
      )
      OR l.child_name ~* '^(CenterChild|LostChild|StaleChild|ManualChild|Merge Child|Neg Child)\b'
      OR l.child_name ~* '^Child [a-z0-9]+$'
    );

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

REVOKE ALL ON FUNCTION public.purge_ephemeral_e2e_leads_for_brand(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.purge_ephemeral_e2e_leads_for_brand(uuid) TO authenticated, service_role;
