-- RLS smoke test: curriculum without versioning

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'levels' AND column_name = 'program_id'
  ) THEN
    RAISE EXCEPTION 'levels.program_id missing';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'curriculum_versions'
  ) THEN
    RAISE EXCEPTION 'curriculum_versions should be dropped';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'pin_enrollment_program') THEN
    RAISE EXCEPTION 'Missing pin_enrollment_program';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'assert_center_program_authorized') THEN
    RAISE EXCEPTION 'Missing assert_center_program_authorized';
  END IF;
  RAISE NOTICE 'RLS remove curriculum versioning smoke test passed';
END $$;
