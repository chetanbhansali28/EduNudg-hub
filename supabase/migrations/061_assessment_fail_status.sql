-- Assessment fail: persist failed level status; expose pass/fail on learn home.

ALTER TABLE public.student_level_progress
  DROP CONSTRAINT IF EXISTS student_level_progress_status_check;

ALTER TABLE public.student_level_progress
  ADD CONSTRAINT student_level_progress_status_check
  CHECK (status IN ('in_progress', 'completed', 'failed'));

CREATE OR REPLACE FUNCTION public.record_student_assessment(
  p_center_id uuid,
  p_student_id uuid,
  p_assessment_type text,
  p_score numeric DEFAULT NULL,
  p_max_score numeric DEFAULT NULL,
  p_assessed_at date DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_visible_to_student boolean DEFAULT true,
  p_level_id uuid DEFAULT NULL,
  p_passed boolean DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_id uuid;
  v_enrollment public.student_enrollments%ROWTYPE;
  v_program_id uuid;
  v_level_id uuid;
  v_level_name text;
  v_passed boolean;
  v_id uuid;
BEGIN
  IF NOT public.has_center_access(p_center_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT fc.brand_id INTO v_brand_id FROM public.franchise_centers fc
  WHERE fc.id = p_center_id AND fc.deleted_at IS NULL;
  IF v_brand_id IS NULL THEN RAISE EXCEPTION 'Center not found'; END IF;

  SELECT * INTO v_enrollment
  FROM public.student_enrollments e
  WHERE e.student_id = p_student_id AND e.center_id = p_center_id AND e.status = 'active'
  ORDER BY e.enrolled_at DESC LIMIT 1;

  IF v_enrollment.id IS NULL THEN
    RAISE EXCEPTION 'No active enrollment';
  END IF;

  v_program_id := v_enrollment.program_id;
  IF v_program_id IS NULL THEN
    RAISE EXCEPTION 'Student has no program assigned';
  END IF;

  v_level_id := coalesce(
    p_level_id,
    public.resolve_student_current_level(p_student_id, v_program_id)
  );

  IF v_level_id IS NULL THEN
    RAISE EXCEPTION 'No level available for assessment';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.levels l
    WHERE l.id = v_level_id AND l.program_id = v_program_id
  ) THEN
    RAISE EXCEPTION 'Level does not belong to student program';
  END IF;

  SELECT l.name INTO v_level_name FROM public.levels l WHERE l.id = v_level_id;

  v_passed := p_passed;
  IF v_passed IS NULL AND p_score IS NOT NULL AND p_max_score IS NOT NULL AND p_max_score > 0 THEN
    v_passed := (p_score / p_max_score) >= 0.7;
  END IF;

  INSERT INTO public.student_assessments (
    brand_id, center_id, student_id, enrollment_id, program_id, level_id,
    assessment_type, score, max_score, assessed_at, notes, visible_to_student, passed
  )
  VALUES (
    v_brand_id, p_center_id, p_student_id, v_enrollment.id, v_program_id, v_level_id,
    coalesce(nullif(trim(p_assessment_type), ''), 'level_check'),
    p_score, p_max_score,
    coalesce(p_assessed_at, (now() AT TIME ZONE 'Asia/Kolkata')::date),
    nullif(trim(coalesce(p_notes, '')), ''),
    coalesce(p_visible_to_student, true),
    v_passed
  )
  RETURNING id INTO v_id;

  IF coalesce(v_passed, false) THEN
    PERFORM public.advance_student_after_level_pass(
      v_brand_id, p_center_id, p_student_id, v_enrollment.id, v_level_id
    );
  ELSIF v_passed IS FALSE THEN
    INSERT INTO public.student_level_progress (
      brand_id, center_id, student_id, enrollment_id, level_id, level_name, status, completed_at
    )
    VALUES (
      v_brand_id, p_center_id, p_student_id, v_enrollment.id, v_level_id, v_level_name,
      'failed', NULL
    )
    ON CONFLICT (student_id, level_name) DO UPDATE
    SET status = 'failed',
        level_id = EXCLUDED.level_id,
        enrollment_id = EXCLUDED.enrollment_id,
        completed_at = NULL,
        updated_at = now();
  END IF;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_student_assessment(uuid, uuid, text, numeric, numeric, date, text, boolean, uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_student_assessment(uuid, uuid, text, numeric, numeric, date, text, boolean, uuid, boolean) TO authenticated;
