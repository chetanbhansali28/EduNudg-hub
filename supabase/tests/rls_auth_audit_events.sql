-- Auth audit writer: anon may execute login_failure; INSERT policy stays self-only.

DO $$
DECLARE
  v_check text;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'auth_audit_logs'
      AND column_name = 'session_id'
  ) THEN
    RAISE EXCEPTION 'auth_audit_logs.session_id missing (097_auth_audit_events)';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'auth_audit_logs'
      AND column_name = 'ip_hash'
  ) THEN
    RAISE EXCEPTION 'auth_audit_logs.ip_hash missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'log_auth_audit_event'
  ) THEN
    RAISE EXCEPTION 'missing log_auth_audit_event';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'log_auth_audit_event'
      AND has_function_privilege('anon', p.oid, 'EXECUTE')
  ) THEN
    RAISE EXCEPTION 'anon must execute log_auth_audit_event for failed logins';
  END IF;

  SELECT with_check INTO v_check
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'auth_audit_logs'
    AND policyname = 'auth_audit_insert';

  IF v_check IS NULL OR v_check = 'true' THEN
    RAISE EXCEPTION 'auth_audit_insert must not use WITH CHECK (true)';
  END IF;

  RAISE NOTICE 'rls_auth_audit_events passed';
END $$;
