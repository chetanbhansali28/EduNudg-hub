-- curriculum_approvals removed; curriculum_versions remains required for enrollments + levels tree.

DO $$
BEGIN
  IF to_regclass('public.curriculum_approvals') IS NOT NULL THEN
    RAISE EXCEPTION 'curriculum_approvals table should be dropped';
  END IF;

  IF to_regclass('public.curriculum_versions') IS NULL THEN
    RAISE EXCEPTION 'curriculum_versions table is required';
  END IF;

  IF to_regprocedure('public.brand_public_curriculum_json(uuid)') IS NULL THEN
    RAISE EXCEPTION 'brand_public_curriculum_json function is required';
  END IF;
END;
$$;
