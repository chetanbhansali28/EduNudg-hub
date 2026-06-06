-- Brand owner credentials RPCs: platform-only read + service-role sync

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_brand_owner_login') THEN
    RAISE EXCEPTION 'Missing get_brand_owner_login';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'sync_brand_owner_membership') THEN
    RAISE EXCEPTION 'Missing sync_brand_owner_membership';
  END IF;

  IF has_function_privilege('anon', 'public.get_brand_owner_login(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon must not execute get_brand_owner_login';
  END IF;

  IF has_function_privilege('anon', 'public.sync_brand_owner_membership(uuid, uuid, text, text, uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon must not execute sync_brand_owner_membership';
  END IF;

  IF has_function_privilege('authenticated', 'public.sync_brand_owner_membership(uuid, uuid, text, text, uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated must not execute sync_brand_owner_membership directly';
  END IF;

  IF NOT has_function_privilege('authenticated', 'public.get_brand_owner_login(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated must execute get_brand_owner_login for platform admins';
  END IF;
END $$;
