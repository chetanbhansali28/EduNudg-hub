-- RLS smoke: center public profile columns and update RPC

BEGIN;

SELECT plan(4);

SELECT has_column('public', 'franchise_centers', 'photo_url', 'franchise_centers.photo_url exists');
SELECT has_column('public', 'franchise_centers', 'social_links', 'franchise_centers.social_links exists');
SELECT ok(
  (SELECT count(*)::int FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'franchise_centers'
     AND column_name IN ('contact_email', 'website_url')) = 0,
  'contact_email and website_url removed'
);
SELECT has_function('public', 'update_center_public_profile_rpc', ARRAY['uuid', 'jsonb']);

SELECT * FROM finish();
ROLLBACK;
