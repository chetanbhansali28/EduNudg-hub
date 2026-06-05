-- Security hardening: tighten permissive RLS INSERT/UPDATE/DELETE policies and revoke anon
-- EXECUTE on SECURITY DEFINER RPCs (except intentional public marketing/signup endpoints).
-- Idempotent: safe to re-run on databases that partially applied earlier migrations.

-- ---------------------------------------------------------------------------
-- 1. auth_audit_logs: users may only append rows for themselves
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS auth_audit_insert ON public.auth_audit_logs;
CREATE POLICY auth_audit_insert ON public.auth_audit_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 2. financial_events: append-only ledger — no direct client inserts (RPC/service only)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS financial_events_insert ON public.financial_events;

-- ---------------------------------------------------------------------------
-- 3. Remove obsolete convert_lead_to_student(uuid) overload (superseded by jsonb arg)
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.convert_lead_to_student(uuid);

-- ---------------------------------------------------------------------------
-- 4. Explicit revokes for sensitive RPCs (017 granted authenticated without revoking PUBLIC)
-- ---------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.approve_platform_brand_signup(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_platform_brand_signup(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.reject_platform_brand_signup(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reject_platform_brand_signup(uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION public.approve_franchise_inquiry(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_franchise_inquiry(uuid, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.reject_franchise_inquiry(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reject_franchise_inquiry(uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION public.upsert_lead_by_whatsapp(uuid, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_lead_by_whatsapp(uuid, text, jsonb) TO authenticated;

REVOKE ALL ON FUNCTION public.convert_lead_to_student(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.convert_lead_to_student(uuid, jsonb) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. SECURITY DEFINER functions: sweep public schema — authenticated-only unless allowlist
-- ---------------------------------------------------------------------------

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
    'get_brand_success_stories_public'
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

-- RLS helper functions (SECURITY DEFINER; used inside policies — authenticated callers only)
REVOKE ALL ON FUNCTION public.is_platform_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.user_brand_ids() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.user_center_ids() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_brand_access(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_center_access(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_brand_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_center_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_brand_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_center_access(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 6. Verify: no permissive write policies remain on public tables
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  r record;
BEGIN
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
    RAISE EXCEPTION 'Permissive RLS policy public.%.% (%): qual=%, with_check=%',
      r.tablename, r.policyname, r.cmd, r.qual, r.with_check;
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- 7. Verify: anon cannot execute staff/admin SECURITY DEFINER RPCs
-- ---------------------------------------------------------------------------

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
    'get_brand_success_stories_public'
  ];
BEGIN
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
    RAISE EXCEPTION 'anon still has EXECUTE on SECURITY DEFINER function %', r.func;
  END LOOP;
END;
$$;
