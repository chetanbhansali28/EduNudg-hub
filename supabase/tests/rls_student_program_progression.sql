-- RLS smoke test: student program progression RPCs (migration 058)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_center_student_program_context') THEN
    RAISE EXCEPTION 'Missing get_center_student_program_context';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'resolve_student_current_level') THEN
    RAISE EXCEPTION 'Missing resolve_student_current_level';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'advance_student_after_level_pass') THEN
    RAISE EXCEPTION 'Missing advance_student_after_level_pass';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'student_assessments'
      AND column_name = 'passed'
  ) THEN
    RAISE EXCEPTION 'Missing student_assessments.passed column';
  END IF;
END $$;
