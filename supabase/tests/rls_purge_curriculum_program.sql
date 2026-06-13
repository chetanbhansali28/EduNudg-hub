-- RLS smoke test: curriculum program purge RPC exists

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'purge_curriculum_program') THEN
    RAISE EXCEPTION 'Missing purge_curriculum_program';
  END IF;
  RAISE NOTICE 'RLS purge curriculum program smoke test passed';
END $$;
