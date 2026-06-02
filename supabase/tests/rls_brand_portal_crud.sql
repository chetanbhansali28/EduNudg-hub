DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'analytics_daily_brand' AND policyname = 'analytics_daily_brand_mutate'
  ) THEN
    RAISE EXCEPTION 'Missing analytics_daily_brand_mutate policy';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'franchise_inquiries' AND policyname = 'franchise_inquiries_brand_update'
  ) THEN
    RAISE EXCEPTION 'Missing franchise_inquiries_brand_update policy';
  END IF;
END $$;
