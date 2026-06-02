DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'franchise_inquiries'
  ) THEN
    RAISE EXCEPTION 'Missing table franchise_inquiries';
  END IF;
END $$;

DO $$
BEGIN
  PERFORM public.get_brand_landing_public('nonexistent-slug');
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'get_brand_landing_public failed: %', SQLERRM;
END $$;
