-- Public brand logos in Supabase Storage (`brand-assets` bucket).
-- Object path: `{brand_id}/logo.{ext}` — one logo per brand (client replaces prior files).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brand-assets',
  'brand-assets',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY brand_assets_public_read ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'brand-assets');

CREATE POLICY brand_assets_platform_all ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'brand-assets' AND public.is_platform_admin())
  WITH CHECK (bucket_id = 'brand-assets' AND public.is_platform_admin());

CREATE POLICY brand_assets_brand_manage ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'brand-assets'
    AND (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND public.has_brand_access((storage.foldername(name))[1]::uuid)
  )
  WITH CHECK (
    bucket_id = 'brand-assets'
    AND (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND public.has_brand_access((storage.foldername(name))[1]::uuid)
  );
