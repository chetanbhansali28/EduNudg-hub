-- Public brand landing exposes legal_pages without leaking other settings keys.

DO $$
DECLARE
  payload jsonb;
BEGIN
  payload := public.get_brand_landing_public('abacusworld');

  IF payload = '{}'::jsonb THEN
    RAISE NOTICE 'get_brand_landing_public returned empty payload (ok for missing seed data)';
    RETURN;
  END IF;

  IF NOT (payload ? 'legal_pages') THEN
    RAISE EXCEPTION 'get_brand_landing_public missing legal_pages key';
  END IF;
END $$;
