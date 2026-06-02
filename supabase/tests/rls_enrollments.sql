DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'student_enrollments' AND policyname = 'enrollments_center'
  ) THEN
    RAISE EXCEPTION 'Missing enrollments_center policy';
  END IF;
  RAISE NOTICE 'RLS enrollments smoke test passed';
END $$;
