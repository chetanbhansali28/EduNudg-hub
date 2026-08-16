-- Smoke: center landing RPCs callable without auth context errors
DO $$
DECLARE
  payload jsonb;
BEGIN
  payload := public.get_center_landing_public('abacusworld', 'koramangala');
  IF payload IS NULL OR payload = '{}'::jsonb THEN
    RAISE NOTICE 'get_center_landing_public returned empty payload (ok for missing seed data)';
  END IF;
  IF payload ? 'success_stories' IS NOT TRUE OR payload ? 'curriculum' IS NOT TRUE THEN
    RAISE EXCEPTION 'get_center_landing_public missing success_stories or curriculum keys';
  END IF;
  IF payload <> '{}'::jsonb AND payload ? 'brand_founders' IS NOT TRUE THEN
    RAISE EXCEPTION 'get_center_landing_public missing brand_founders key';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'get_center_landing_public failed: %', SQLERRM;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'center_public_curriculum_json'
  ) THEN
    RAISE EXCEPTION 'Missing center_public_curriculum_json';
  END IF;
END;
$$;

DO $$
DECLARE
  payload jsonb;
BEGIN
  payload := public.get_brand_landing_public('abacusworld');
  IF payload IS NULL OR payload = '{}'::jsonb THEN
    RAISE NOTICE 'get_brand_landing_public returned empty payload (ok for missing seed data)';
  END IF;
  IF payload ? 'curriculum' IS NOT TRUE THEN
    RAISE EXCEPTION 'get_brand_landing_public missing curriculum key';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'get_brand_landing_public curriculum check failed: %', SQLERRM;
END;
$$;
