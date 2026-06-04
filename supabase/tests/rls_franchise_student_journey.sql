-- RLS smoke test: franchise student journey objects
-- Run via: pnpm test:rls

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'platform_brand_signups') THEN
    RAISE EXCEPTION 'Missing platform_brand_signups table';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lead_events') THEN
    RAISE EXCEPTION 'Missing lead_events table';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'submit_brand_student_application') THEN
    RAISE EXCEPTION 'Missing submit_brand_student_application';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'mark_lead_lost') THEN
    RAISE EXCEPTION 'Missing mark_lead_lost';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'reopen_lead') THEN
    RAISE EXCEPTION 'Missing reopen_lead';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'approve_platform_brand_signup') THEN
    RAISE EXCEPTION 'Missing approve_platform_brand_signup';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'approve_franchise_inquiry') THEN
    RAISE EXCEPTION 'Missing approve_franchise_inquiry';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'reject_franchise_inquiry') THEN
    RAISE EXCEPTION 'Missing reject_franchise_inquiry';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'brand_success_stories') THEN
    RAISE EXCEPTION 'Missing brand_success_stories table';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_brand_student_lead_staff') THEN
    RAISE EXCEPTION 'Missing create_brand_student_lead_staff';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_platform_brand_signup_staff') THEN
    RAISE EXCEPTION 'Missing create_platform_brand_signup_staff';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'reject_platform_brand_signup') THEN
    RAISE EXCEPTION 'Missing reject_platform_brand_signup';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'convert_lead_to_student'
      AND pg_get_function_arguments(p.oid) LIKE '%jsonb%'
  ) THEN
    RAISE EXCEPTION 'Missing convert_lead_to_student with overrides';
  END IF;
  RAISE NOTICE 'RLS franchise student journey smoke test passed';
END $$;
