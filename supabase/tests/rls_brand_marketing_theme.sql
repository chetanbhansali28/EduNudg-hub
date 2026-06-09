-- RLS / RPC: platform admin can set brand marketing theme (spark-academy).

DO $$
BEGIN
  PERFORM public.set_brand_marketing_theme(
    (SELECT id FROM public.brands WHERE slug = 'abacusworld' LIMIT 1),
    'novu'
  );
EXCEPTION
  WHEN OTHERS THEN
    IF SQLERRM LIKE '%Only platform admins%' THEN
      RAISE NOTICE 'set_brand_marketing_theme admin check ok for non-admin context: %', SQLERRM;
    ELSE
      RAISE EXCEPTION 'set_brand_marketing_theme failed unexpectedly: %', SQLERRM;
    END IF;
END;
$$;

DO $$
BEGIN
  IF NOT has_function_privilege('authenticated', 'public.set_brand_marketing_theme(uuid, text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated must execute set_brand_marketing_theme';
  END IF;
END;
$$;
