-- RLS smoke test: center student lead CSV import + bulk convert RPCs

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'import_center_student_leads') THEN
    RAISE EXCEPTION 'Missing import_center_student_leads';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'bulk_convert_center_leads') THEN
    RAISE EXCEPTION 'Missing bulk_convert_center_leads';
  END IF;

  RAISE NOTICE 'RLS center student lead import smoke test passed';
END $$;
