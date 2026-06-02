-- RLS smoke test: platform admin CRUD policies exist

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'platform_invoices' AND policyname = 'platform_invoices_admin'
  ) THEN
    RAISE EXCEPTION 'Missing platform_invoices_admin policy';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'analytics_daily_brand' AND policyname = 'analytics_daily_brand_admin'
  ) THEN
    RAISE EXCEPTION 'Missing analytics_daily_brand_admin policy';
  END IF;
  RAISE NOTICE 'RLS platform CRUD smoke test passed';
END $$;
