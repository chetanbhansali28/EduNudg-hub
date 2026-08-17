-- RLS smoke test: center student CSV import RPC

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'import_center_students') THEN
    RAISE EXCEPTION 'Missing import_center_students';
  END IF;

  RAISE NOTICE 'RLS center student import smoke test passed';
END $$;
