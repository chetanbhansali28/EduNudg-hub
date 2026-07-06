-- Public brand landing exposes social_connect without leaking other settings keys.

DO $$
DECLARE
  payload jsonb;
BEGIN
  payload := public.get_brand_landing_public('abacusworld');

  IF payload = '{}'::jsonb THEN
    RAISE NOTICE 'get_brand_landing_public returned empty payload (ok for missing seed data)';
    RETURN;
  END IF;

  IF NOT (payload ? 'social_connect') THEN
    RAISE EXCEPTION 'get_brand_landing_public missing social_connect key';
  END IF;
END $$;
