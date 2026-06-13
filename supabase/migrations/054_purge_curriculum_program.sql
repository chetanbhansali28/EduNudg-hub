-- Hard-delete a curriculum program (course) and detach dependent rows.
-- One-time cleanup: remove legacy standalone programs named "Level 1" / "Level 2".

CREATE OR REPLACE FUNCTION public.purge_curriculum_program(p_program_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_id uuid;
  v_version_ids uuid[];
  v_level_ids uuid[];
BEGIN
  SELECT p.brand_id INTO v_brand_id
  FROM public.programs p
  WHERE p.id = p_program_id AND p.deleted_at IS NULL;

  IF v_brand_id IS NULL THEN
    RETURN;
  END IF;

  -- Migrations run as postgres with no JWT; enforce RBAC only for app callers.
  IF auth.uid() IS NOT NULL
     AND NOT public.has_brand_access(v_brand_id)
     AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT coalesce(array_agg(cv.id), ARRAY[]::uuid[])
  INTO v_version_ids
  FROM public.curriculum_versions cv
  WHERE cv.program_id = p_program_id;

  SELECT coalesce(array_agg(l.id), ARRAY[]::uuid[])
  INTO v_level_ids
  FROM public.levels l
  WHERE l.curriculum_version_id = ANY (v_version_ids);

  -- Student progress tied to levels in this program (id or denormalized name).
  DELETE FROM public.student_level_progress slp
  WHERE slp.brand_id = v_brand_id
    AND (
      slp.level_id = ANY (v_level_ids)
      OR slp.level_name IN (
        SELECT l.name FROM public.levels l WHERE l.id = ANY (v_level_ids)
      )
    );

  -- Detach enrollments pinned to these curriculum versions.
  UPDATE public.student_enrollments e
  SET curriculum_version_id = NULL, updated_at = now()
  WHERE e.curriculum_version_id = ANY (v_version_ids);

  -- Retire batches that reference this program's curriculum or level range.
  UPDATE public.batches b
  SET
    deleted_at = coalesce(b.deleted_at, now()),
    curriculum_version_id = NULL,
    level_start_id = NULL,
    level_end_id = NULL,
    level_id = NULL,
    updated_at = now()
  WHERE b.curriculum_version_id = ANY (v_version_ids)
     OR b.level_start_id = ANY (v_level_ids)
     OR b.level_end_id = ANY (v_level_ids)
     OR b.level_id = ANY (v_level_ids);

  DELETE FROM public.programs WHERE id = p_program_id;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_curriculum_program(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.purge_curriculum_program(uuid) TO authenticated;

-- Remove legacy standalone courses (old model: each level was its own "course").
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.id
    FROM public.programs p
    WHERE p.deleted_at IS NULL
      AND p.name IN ('Level 1', 'Level 2')
  LOOP
    PERFORM public.purge_curriculum_program(r.id);
  END LOOP;
END $$;
