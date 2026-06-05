-- Smoke: subscription plan default flag and public pricing RPC

BEGIN;

SELECT plan(3);

SELECT ok(
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'subscription_plans'
      AND column_name = 'is_default'
  ),
  'is_default column exists'
);

SELECT lives_ok(
  $$SELECT public.list_public_subscription_plans()$$,
  'public pricing RPC executes'
);

SELECT ok(
  jsonb_typeof(public.list_public_subscription_plans()) = 'array',
  'returns json array'
);

SELECT finish();
ROLLBACK;
