-- RLS smoke test: merchandise SKUs tied to franchise curriculum.
-- Dashboard-runnable (no pgTAP). Also run via: pnpm test:rls

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'merchandise_catalog_programs'
  ) THEN
    RAISE EXCEPTION 'Missing merchandise_catalog_programs table';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'merchandise_catalog_programs'
      AND column_name = 'program_id'
  ) THEN
    RAISE EXCEPTION 'Missing merchandise_catalog_programs.program_id';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'merchandise_catalog_programs'
      AND policyname = 'merchandise_catalog_programs_brand'
  ) THEN
    RAISE EXCEPTION 'Missing merchandise_catalog_programs_brand policy';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'merchandise_catalog_programs'
      AND policyname = 'merchandise_catalog_programs_center_read'
  ) THEN
    RAISE EXCEPTION 'Missing merchandise_catalog_programs_center_read policy';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'merchandise_catalog_programs'
      AND column_name = 'level_id'
  ) THEN
    RAISE EXCEPTION 'Missing merchandise_catalog_programs.level_id';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'list_center_active_merchandise_catalog') THEN
    RAISE EXCEPTION 'Missing list_center_active_merchandise_catalog';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'list_center_active_merchandise_catalog'
      AND pg_get_functiondef(oid) ILIKE '%SETOF%merchandise_catalog%'
  ) THEN
    RAISE EXCEPTION 'list_center_active_merchandise_catalog must return SETOF merchandise_catalog';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'sync_merchandise_catalog_programs'
      AND pg_get_functiondef(oid) ILIKE '%SELECT value FROM jsonb_array_elements%'
  ) THEN
    RAISE EXCEPTION 'sync_merchandise_catalog_programs must parse jsonb via SELECT value FROM jsonb_array_elements';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'center_can_order_catalog_item') THEN
    RAISE EXCEPTION 'Missing center_can_order_catalog_item';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'merchandise_catalog'
      AND policyname = 'merchandise_catalog_center_read'
  ) THEN
    RAISE EXCEPTION 'Missing merchandise_catalog_center_read policy';
  END IF;

  RAISE NOTICE 'RLS merchandise catalog programs smoke test passed';
END $$;
