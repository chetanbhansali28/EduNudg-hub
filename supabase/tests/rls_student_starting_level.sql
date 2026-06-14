-- RLS smoke test: starting level enrollment (migration 059)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'student_enrollments'
      AND column_name = 'starting_level_id'
  ) THEN
    RAISE EXCEPTION 'Missing student_enrollments.starting_level_id';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'initialize_student_program_at_level') THEN
    RAISE EXCEPTION 'Missing initialize_student_program_at_level';
  END IF;
END $$;
