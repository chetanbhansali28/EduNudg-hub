-- Security hardening smoke: permissive RLS + anon EXECUTE on sensitive RPCs

DO $$
DECLARE
  v_check text;
  r record;
  anon_allowed text[] := ARRAY[
    'get_portal_branding',
    'get_center_landing_public',
    'submit_center_enrollment_lead',
    'submit_platform_brand_signup',
    'submit_brand_student_application',
    'submit_center_student_registration',
    'submit_franchise_inquiry_v2',
    'submit_franchise_inquiry',
    'get_brand_landing_public',
    'get_brand_success_stories_public'
  ];
BEGIN
  SELECT with_check INTO v_check
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'auth_audit_logs'
    AND policyname = 'auth_audit_insert';

  IF v_check IS NULL OR v_check = 'true' THEN
    RAISE EXCEPTION 'auth_audit_insert must not use WITH CHECK (true)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'financial_events'
      AND policyname = 'financial_events_insert'
  ) THEN
    RAISE EXCEPTION 'financial_events should not allow direct authenticated INSERT';
  END IF;

  FOR r IN
    SELECT tablename, policyname, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')
      AND (
        with_check = 'true'
        OR (cmd IN ('UPDATE', 'DELETE', 'ALL') AND qual = 'true')
      )
  LOOP
    RAISE EXCEPTION 'Permissive write policy public.%.% (%): qual=%, with_check=%',
      r.tablename, r.policyname, r.cmd, r.qual, r.with_check;
  END LOOP;

  IF has_function_privilege(
    'anon',
    'public.create_center_kit_order_rpc(uuid, uuid, uuid, integer, bigint)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'anon must not execute create_center_kit_order_rpc';
  END IF;

  IF has_function_privilege('anon', 'public.approve_platform_brand_signup(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon must not execute approve_platform_brand_signup';
  END IF;

  IF has_function_privilege('anon', 'public.approve_franchise_inquiry(uuid, text, text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon must not execute approve_franchise_inquiry';
  END IF;

  IF has_function_privilege('anon', 'public.assign_lead_to_center(uuid, uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon must not execute assign_lead_to_center';
  END IF;

  IF has_function_privilege('anon', 'public.record_platform_payment(uuid, text, bigint)', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon must not execute record_platform_payment';
  END IF;

  IF NOT has_function_privilege('anon', 'public.get_brand_landing_public(text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon must retain get_brand_landing_public for public marketing';
  END IF;

  IF NOT has_function_privilege('anon', 'public.submit_brand_student_application(text, text, text, text, text, text, text, date, text, text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon must retain submit_brand_student_application for public forms';
  END IF;

  FOR r IN
    SELECT p.oid::regprocedure AS func, p.proname AS name
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND p.prokind = 'f'
      AND NOT (p.proname = ANY (anon_allowed))
      AND has_function_privilege('anon', p.oid, 'EXECUTE')
  LOOP
    RAISE EXCEPTION 'anon must not execute SECURITY DEFINER function %', r.func;
  END LOOP;

  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'convert_lead_to_student'
      AND pg_get_function_arguments(p.oid) = 'p_lead_id uuid'
  ) THEN
    RAISE EXCEPTION 'Obsolete convert_lead_to_student(uuid) overload must be dropped';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND (
        p.proconfig IS NULL
        OR NOT EXISTS (
          SELECT 1 FROM unnest(p.proconfig) cfg WHERE cfg LIKE 'search_path=%'
        )
      )
  ) THEN
    RAISE EXCEPTION 'All public functions must SET search_path (e.g. slugify_text)';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_views v
    WHERE v.schemaname = 'public'
      AND v.definition ILIKE '%security definer%'
  ) THEN
    RAISE EXCEPTION 'Unexpected SECURITY DEFINER views in public schema';
  END IF;

  RAISE NOTICE 'RLS security hardening smoke test passed';
END $$;
