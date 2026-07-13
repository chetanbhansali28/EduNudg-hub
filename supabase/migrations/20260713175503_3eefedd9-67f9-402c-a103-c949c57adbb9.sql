-- Replace the broad anon/authenticated SELECT policy with one that excludes any path
-- whose second folder segment is 'students'. Public marketing files remain readable
-- (public bucket CDN serves individual files without needing RLS), and this preserves
-- the presence of the policy expected by supabase/tests/rls_brand_assets_storage.sql.
DROP POLICY IF EXISTS "brand_assets_public_read" ON storage.objects;

CREATE POLICY "brand_assets_public_read" ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id = 'brand-assets'
    AND (
      COALESCE(array_length(storage.foldername(name), 1), 0) < 2
      OR (storage.foldername(name))[2] IS DISTINCT FROM 'students'
    )
  );