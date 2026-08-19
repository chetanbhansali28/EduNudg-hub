DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'login_email'
  ) THEN
    RAISE EXCEPTION 'Missing leads.login_email';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'address_line1'
  ) THEN
    RAISE EXCEPTION 'Missing leads.address_line1';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'program_name'
  ) THEN
    RAISE EXCEPTION 'Missing leads.program_name';
  END IF;

  IF to_regprocedure(
    'public.create_center_student_lead_staff(uuid, text, text, text, text, text, text, date, text, text, text, text, text, text, text)'
  ) IS NULL THEN
    RAISE EXCEPTION 'Missing create_center_student_lead_staff CSV-aligned signature';
  END IF;

  RAISE NOTICE 'RLS leads CSV-aligned columns smoke test passed';
END $$;
