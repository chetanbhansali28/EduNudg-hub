-- Re-sweep SECURITY DEFINER EXECUTE: Supabase default privileges grant anon on new RPCs.
-- Same allowlist as supabase/tests/rls_security_hardening.sql.

DO $$
DECLARE
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
    'get_brand_success_stories_public',
    'log_auth_audit_event',
    'log_client_error_event'
  ];
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS func, p.proname AS name
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND p.prokind = 'f'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', r.func);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', r.func);

    IF r.name = ANY (anon_allowed) THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon, authenticated', r.func);
    ELSE
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.func);
    END IF;
  END LOOP;
END;
$$;
