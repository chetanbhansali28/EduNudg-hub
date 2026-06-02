-- RLS smoke test: brands table policies exist
-- Run via: pnpm test:rls (scripts/run-rls-tests.mjs)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'brands' AND policyname = 'brands_select'
  ) THEN
    RAISE EXCEPTION 'Missing brands_select policy';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'is_platform_admin'
  ) THEN
    RAISE EXCEPTION 'Missing is_platform_admin function';
  END IF;
  RAISE NOTICE 'RLS brands smoke test passed';
END $$;
