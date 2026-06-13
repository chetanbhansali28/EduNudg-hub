-- RLS smoke test: franchise center lifecycle + curriculum version enablement

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'center_status_events'
  ) THEN
    RAISE EXCEPTION 'Missing center_status_events table';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'center_curriculum_enablement'
  ) THEN
    RAISE EXCEPTION 'Missing center_curriculum_enablement table';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_center_operational') THEN
    RAISE EXCEPTION 'Missing is_center_operational';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_franchise_center_status') THEN
    RAISE EXCEPTION 'Missing set_franchise_center_status';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'sync_center_curriculum_enablement') THEN
    RAISE EXCEPTION 'Missing sync_center_curriculum_enablement';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_curriculum_version_authorized_for_center') THEN
    RAISE EXCEPTION 'Missing is_curriculum_version_authorized_for_center';
  END IF;

  RAISE NOTICE 'RLS franchise center lifecycle smoke test passed';
END $$;
