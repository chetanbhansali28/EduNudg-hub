-- Smoke: center landing RPCs callable without auth context errors
DO $$
BEGIN
  PERFORM public.get_center_landing_public('abacusworld', 'koramangala');
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'get_center_landing_public failed: %', SQLERRM;
END;
$$;
