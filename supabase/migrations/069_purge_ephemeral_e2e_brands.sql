-- Permanently delete ephemeral E2E brands (name/slug patterns) and matching signups.
-- Also hard-deletes platform_audit_logs that reference those brands or E2E signup payloads.
-- Seed brands abacusworld / smart-brain-abacus are never touched.
-- Clears non-CASCADE FKs before DELETE FROM brands (cascades cover the rest).

CREATE OR REPLACE FUNCTION public.purge_ephemeral_e2e_brands()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_ids uuid[];
  v_brands_deleted int := 0;
  v_signups_deleted int := 0;
  v_audit_deleted int := 0;
BEGIN
  -- JWT callers must be platform admin; direct DB / service role (auth.uid null) is allowed.
  IF auth.uid() IS NOT NULL AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT COALESCE(array_agg(b.id), ARRAY[]::uuid[])
  INTO v_brand_ids
  FROM public.brands b
  WHERE b.slug NOT IN ('abacusworld', 'smart-brain-abacus')
    AND (
      b.name ~* '^E2E Brand\b'
      OR b.slug ~* '^e2e-brand-'
    );

  -- Audit first: brand_id match + leftover payload markers (even if brands already gone).
  DELETE FROM public.platform_audit_logs
  WHERE (cardinality(v_brand_ids) > 0 AND brand_id = ANY (v_brand_ids))
     OR coalesce(payload->>'requested_name', '') ~* '^E2E Brand\b'
     OR coalesce(payload->>'email', '') ~* '^e2e-brand-.+@example\.com$'
     OR coalesce(payload->>'slug', '') ~* '^e2e-brand-';
  GET DIAGNOSTICS v_audit_deleted = ROW_COUNT;

  IF cardinality(v_brand_ids) > 0 THEN
    UPDATE public.platform_brand_signups
    SET converted_brand_id = NULL, updated_at = now()
    WHERE converted_brand_id = ANY (v_brand_ids);

    DELETE FROM public.platform_invoices WHERE brand_id = ANY (v_brand_ids);
    DELETE FROM public.financial_events WHERE brand_id = ANY (v_brand_ids);
    DELETE FROM public.enrollment_history WHERE brand_id = ANY (v_brand_ids);
    DELETE FROM public.transfer_requests WHERE brand_id = ANY (v_brand_ids);
    DELETE FROM public.support_tickets WHERE brand_id = ANY (v_brand_ids);

    DELETE FROM public.brands WHERE id = ANY (v_brand_ids);
    GET DIAGNOSTICS v_brands_deleted = ROW_COUNT;
  END IF;

  DELETE FROM public.platform_brand_signups
  WHERE email ~* '^e2e-brand-.+@example\.com$'
     OR requested_name ~* '^E2E Brand\b';
  GET DIAGNOSTICS v_signups_deleted = ROW_COUNT;

  RETURN jsonb_build_object(
    'brands_deleted', v_brands_deleted,
    'signups_deleted', v_signups_deleted,
    'audit_logs_deleted', v_audit_deleted
  );
END;
$$;

REVOKE ALL ON FUNCTION public.purge_ephemeral_e2e_brands() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.purge_ephemeral_e2e_brands() TO authenticated, service_role;
