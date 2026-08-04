-- Batches feature flag: helper default OFF + RLS policy shape

BEGIN;

SELECT plan(3);

SELECT has_function('public', 'brand_feature_enabled', ARRAY['uuid', 'text'], 'brand_feature_enabled exists');

SELECT policies_are(
  'public',
  'batches',
  ARRAY['batches_center']
);

SELECT is(
  (
    SELECT public.brand_feature_enabled('00000000-0000-0000-0000-000000000001'::uuid, 'batches')
  ),
  false,
  'batches defaults to false when brand_settings missing'
);

SELECT * FROM finish();
ROLLBACK;
