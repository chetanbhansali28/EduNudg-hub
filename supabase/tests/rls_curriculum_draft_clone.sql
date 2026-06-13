-- RLS smoke test: level delete guards (version clone removed)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'assert_level_deletable') THEN
    RAISE EXCEPTION 'Missing assert_level_deletable';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'delete_curriculum_level') THEN
    RAISE EXCEPTION 'Missing delete_curriculum_level';
  END IF;
  RAISE NOTICE 'RLS curriculum level delete smoke test passed';
END $$;
