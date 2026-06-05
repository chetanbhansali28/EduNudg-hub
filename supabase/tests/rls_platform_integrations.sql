-- Platform integration toggles smoke

BEGIN;

SELECT plan(3);

SELECT ok(
  EXISTS (
    SELECT 1 FROM public.platform_settings WHERE key = 'integrations'
  ),
  'integrations settings row exists'
);

SELECT ok(
  public.platform_integration_enabled('auth_email') = true,
  'auth_email enabled by default'
);

SELECT ok(
  public.platform_integration_enabled('payment_gateway') = false,
  'payment_gateway disabled by default'
);

SELECT finish();
ROLLBACK;
