-- RLS smoke test: curriculum draft clone and level delete guards

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'clone_curriculum_version_to_draft') THEN
    RAISE EXCEPTION 'Missing clone_curriculum_version_to_draft';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'assert_level_deletable') THEN
    RAISE EXCEPTION 'Missing assert_level_deletable';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'delete_curriculum_level') THEN
    RAISE EXCEPTION 'Missing delete_curriculum_level';
  END IF;
  RAISE NOTICE 'RLS curriculum draft clone smoke test passed';
END $$;
