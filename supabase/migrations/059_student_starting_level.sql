-- Starting level on enrollment; pin program at a specific level for journey tracking.

ALTER TABLE public.student_enrollments
  ADD COLUMN IF NOT EXISTS starting_level_id uuid REFERENCES public.levels(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_enrollments_starting_level
  ON public.student_enrollments (starting_level_id)
  WHERE starting_level_id IS NOT NULL;

-- Initialize progress: prior levels completed, chosen level in progress.
CREATE OR REPLACE FUNCTION public.initialize_student_program_at_level(
  p_brand_id uuid,
  p_center_id uuid,
  p_student_id uuid,
  p_enrollment_id uuid,
  p_program_id uuid,
  p_start_level_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_sort int;
  v_level record;
BEGIN
  SELECT l.sort_order INTO v_start_sort
  FROM public.levels l
  WHERE l.id = p_start_level_id AND l.program_id = p_program_id;

  IF v_start_sort IS NULL THEN
    RAISE EXCEPTION 'Start level not found in program';
  END IF;

  DELETE FROM public.student_level_progress slp
  WHERE slp.student_id = p_student_id
    AND (
      slp.level_id IN (SELECT id FROM public.levels WHERE program_id = p_program_id)
      OR slp.level_name IN (SELECT name FROM public.levels WHERE program_id = p_program_id)
    );

  FOR v_level IN
    SELECT l.id, l.name, l.sort_order
    FROM public.levels l
    WHERE l.program_id = p_program_id
    ORDER BY l.sort_order ASC
  LOOP
    IF v_level.sort_order < v_start_sort THEN
      INSERT INTO public.student_level_progress (
        brand_id, center_id, student_id, enrollment_id, level_id, level_name, status, completed_at
      )
      VALUES (
        p_brand_id, p_center_id, p_student_id, p_enrollment_id, v_level.id, v_level.name,
        'completed', now()
      );
    ELSIF v_level.id = p_start_level_id THEN
      INSERT INTO public.student_level_progress (
        brand_id, center_id, student_id, enrollment_id, level_id, level_name, status, completed_at
      )
      VALUES (
        p_brand_id, p_center_id, p_student_id, p_enrollment_id, v_level.id, v_level.name,
        'in_progress', NULL
      );
    END IF;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.initialize_student_program_at_level(uuid, uuid, uuid, uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.initialize_student_program_at_level(uuid, uuid, uuid, uuid, uuid, uuid) TO authenticated;

DROP FUNCTION IF EXISTS public.pin_enrollment_program(uuid, uuid);

CREATE OR REPLACE FUNCTION public.pin_enrollment_program(
  p_enrollment_id uuid,
  p_program_id uuid,
  p_start_level_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enrollment public.student_enrollments%ROWTYPE;
  v_brand_id uuid;
  v_start_level_id uuid;
BEGIN
  SELECT * INTO v_enrollment FROM public.student_enrollments WHERE id = p_enrollment_id;
  IF v_enrollment.id IS NULL THEN
    RAISE EXCEPTION 'Enrollment not found';
  END IF;

  SELECT fc.brand_id INTO v_brand_id
  FROM public.franchise_centers fc
  WHERE fc.id = v_enrollment.center_id;

  IF NOT public.has_center_access(v_enrollment.center_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF NOT public.has_brand_access(v_brand_id) AND NOT public.is_platform_admin() THEN
    PERFORM public.assert_center_operational(v_enrollment.center_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.programs p
    WHERE p.id = p_program_id AND p.brand_id = v_enrollment.brand_id AND p.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Program not found';
  END IF;

  PERFORM public.assert_center_program_authorized(v_enrollment.center_id, p_program_id);

  IF p_start_level_id IS NULL THEN
    SELECT l.id INTO v_start_level_id
    FROM public.levels l
    WHERE l.program_id = p_program_id
    ORDER BY l.sort_order ASC
    LIMIT 1;
  ELSE
    v_start_level_id := p_start_level_id;
  END IF;

  IF v_start_level_id IS NULL THEN
    RAISE EXCEPTION 'Program has no levels';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.levels l
    WHERE l.id = v_start_level_id AND l.program_id = p_program_id
  ) THEN
    RAISE EXCEPTION 'Start level does not belong to program';
  END IF;

  UPDATE public.student_enrollments
  SET program_id = p_program_id,
      starting_level_id = v_start_level_id,
      updated_at = now()
  WHERE id = p_enrollment_id;

  PERFORM public.initialize_student_program_at_level(
    v_enrollment.brand_id,
    v_enrollment.center_id,
    v_enrollment.student_id,
    v_enrollment.id,
    p_program_id,
    v_start_level_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.pin_enrollment_program(uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pin_enrollment_program(uuid, uuid, uuid) TO authenticated;

-- Center context: include assigned starting level
CREATE OR REPLACE FUNCTION public.get_center_student_program_context(
  p_center_id uuid,
  p_student_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enrollment public.student_enrollments%ROWTYPE;
  v_program_id uuid;
  v_current_level_id uuid;
BEGIN
  IF NOT public.has_center_access(p_center_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_enrollment
  FROM public.student_enrollments e
  WHERE e.student_id = p_student_id
    AND e.center_id = p_center_id
    AND e.status = 'active'
  ORDER BY e.enrolled_at DESC
  LIMIT 1;

  IF v_enrollment.id IS NULL THEN
    RAISE EXCEPTION 'No active enrollment';
  END IF;

  v_program_id := v_enrollment.program_id;

  IF v_program_id IS NOT NULL THEN
    v_current_level_id := public.resolve_student_current_level(p_student_id, v_program_id);
  END IF;

  RETURN jsonb_build_object(
    'enrollment_id', v_enrollment.id,
    'program_id', v_program_id,
    'program_name', (SELECT p.name FROM public.programs p WHERE p.id = v_program_id),
    'starting_level_id', v_enrollment.starting_level_id,
    'starting_level_name', (
      SELECT l.name FROM public.levels l WHERE l.id = v_enrollment.starting_level_id
    ),
    'current_level_id', v_current_level_id,
    'current_level_name', (SELECT l.name FROM public.levels l WHERE l.id = v_current_level_id),
    'levels', CASE WHEN v_program_id IS NULL THEN '[]'::jsonb ELSE COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'level_id', l.id,
        'name', l.name,
        'sort_order', l.sort_order,
        'status', coalesce(slp.status, 'not_started'),
        'abacus_level_code', l.abacus_level_code
      ) ORDER BY l.sort_order)
      FROM public.levels l
      LEFT JOIN public.student_level_progress slp ON slp.student_id = p_student_id
        AND (slp.level_id = l.id OR slp.level_name = l.name)
      WHERE l.program_id = v_program_id
    ), '[]'::jsonb) END
  );
END;
$$;
