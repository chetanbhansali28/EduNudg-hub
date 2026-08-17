-- Portal branding RPC exists, is callable by anon, prefers Site logo, and uses franchise display_name

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'get_portal_branding'
      AND pg_get_functiondef(p.oid) LIKE '%landing,meta,logoUrl%'
  ) THEN
    RAISE EXCEPTION 'Missing function get_portal_branding or Site logo preference';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'get_portal_branding'
      AND pg_get_functiondef(p.oid) LIKE '%display_name%'
  ) THEN
    RAISE EXCEPTION 'get_portal_branding must prefer franchise display_name';
  END IF;
END $$;

DO $$
BEGIN
  PERFORM public.get_portal_branding(NULL, NULL);
  PERFORM public.get_portal_branding('nonexistent-brand-slug', NULL);
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'get_portal_branding failed: %', SQLERRM;
END $$;
