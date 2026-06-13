-- RLS smoke test: fix get_student_program_ladders (no student_assessments.level_id)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_student_program_ladders') THEN
    RAISE EXCEPTION 'Missing get_student_program_ladders';
  END IF;
  RAISE NOTICE 'RLS fix student program ladders smoke test passed';
END $$;
