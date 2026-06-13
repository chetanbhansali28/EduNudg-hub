-- curriculum_versions removed; levels attach to programs directly.

DO $$
BEGIN
  IF to_regclass('public.curriculum_approvals') IS NOT NULL THEN
    RAISE EXCEPTION 'curriculum_approvals table should be dropped';
  END IF;

  IF to_regclass('public.curriculum_versions') IS NOT NULL THEN
    RAISE EXCEPTION 'curriculum_versions table should be dropped';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'levels' AND column_name = 'program_id'
  ) THEN
    RAISE EXCEPTION 'levels.program_id is required';
  END IF;

  IF to_regprocedure('public.brand_public_curriculum_json(uuid)') IS NULL THEN
    RAISE EXCEPTION 'brand_public_curriculum_json function is required';
  END IF;
END;
$$;
