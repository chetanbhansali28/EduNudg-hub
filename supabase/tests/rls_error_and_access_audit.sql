-- Phase B/C: error reports (platform read) + access logs + tenant list RPC.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'client_error_reports'
  ) THEN
    RAISE EXCEPTION 'client_error_reports missing (098_error_and_access_audit)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'access_audit_logs'
  ) THEN
    RAISE EXCEPTION 'access_audit_logs missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'log_client_error_event'
      AND has_function_privilege('anon', p.oid, 'EXECUTE')
  ) THEN
    RAISE EXCEPTION 'anon must execute log_client_error_event';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'log_access_audit_event'
      AND has_function_privilege('anon', p.oid, 'EXECUTE')
  ) THEN
    RAISE EXCEPTION 'anon must not execute log_access_audit_event';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'list_tenant_staff_audit'
      AND has_function_privilege('authenticated', p.oid, 'EXECUTE')
  ) THEN
    RAISE EXCEPTION 'authenticated must execute list_tenant_staff_audit';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'client_error_reports'
      AND policyname = 'client_error_reports_platform_read'
  ) THEN
    RAISE EXCEPTION 'client_error_reports_platform_read policy missing';
  END IF;

  RAISE NOTICE 'rls_error_and_access_audit passed';
END $$;
