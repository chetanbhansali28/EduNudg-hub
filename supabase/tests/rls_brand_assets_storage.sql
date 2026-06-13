-- RLS smoke test: brand-assets storage policies
-- Run via: pnpm test:rls

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'brand-assets') THEN
    RAISE EXCEPTION 'Missing brand-assets storage bucket';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'brand_assets_public_read'
  ) THEN
    RAISE EXCEPTION 'Missing brand_assets_public_read policy';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'brand_assets_platform_all'
  ) THEN
    RAISE EXCEPTION 'Missing brand_assets_platform_all policy';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'brand_assets_brand_manage'
  ) THEN
    RAISE EXCEPTION 'Missing brand_assets_brand_manage policy';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'brand_assets_student_self'
  ) THEN
    RAISE EXCEPTION 'Missing brand_assets_student_self policy';
  END IF;
  RAISE NOTICE 'RLS brand-assets storage smoke test passed';
END $$;
