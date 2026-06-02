-- Portal branding RPC exists and is callable by anon

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'get_portal_branding'
  ) THEN
    RAISE EXCEPTION 'Missing function get_portal_branding';
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
