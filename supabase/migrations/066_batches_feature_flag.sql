-- Brand feature flag: batches (default OFF). Full gate — helper, RPCs, RLS.

CREATE OR REPLACE FUNCTION public.brand_feature_enabled(p_brand_id uuid, p_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_key = 'merchandise' THEN COALESCE(
      (SELECT (bs.settings -> 'features' ->> 'merchandise')::boolean FROM public.brand_settings bs WHERE bs.brand_id = p_brand_id),
      (SELECT (bs.settings -> 'features' ->> 'kits')::boolean FROM public.brand_settings bs WHERE bs.brand_id = p_brand_id),
      false
    )
    WHEN p_key = 'kits' THEN public.brand_feature_enabled(p_brand_id, 'merchandise')
    WHEN p_key = 'batches' THEN COALESCE(
      (SELECT (bs.settings -> 'features' ->> 'batches')::boolean FROM public.brand_settings bs WHERE bs.brand_id = p_brand_id),
      false
    )
    ELSE COALESCE(
      (SELECT (bs.settings -> 'features' ->> p_key)::boolean FROM public.brand_settings bs WHERE bs.brand_id = p_brand_id),
      true
    )
  END;
$$;

-- RLS: center staff only see/mutate batches when the brand flag is on.
DROP POLICY IF EXISTS batches_center ON public.batches;
CREATE POLICY batches_center ON public.batches FOR ALL TO authenticated
  USING (
    public.has_center_access(center_id)
    AND public.brand_feature_enabled(brand_id, 'batches')
  )
  WITH CHECK (
    public.has_center_access(center_id)
    AND public.brand_feature_enabled(brand_id, 'batches')
  );

CREATE OR REPLACE FUNCTION public.upsert_center_batch(
  p_batch_id uuid,
  p_center_id uuid,
  p_name text,
  p_program_id uuid,
  p_level_start_id uuid,
  p_level_end_id uuid,
  p_is_open_for_enrollment boolean DEFAULT false,
  p_schedule jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_id uuid;
  v_batch_id uuid;
  v_start_order int;
  v_end_order int;
BEGIN
  IF NOT public.has_center_access(p_center_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT fc.brand_id INTO v_brand_id FROM public.franchise_centers fc WHERE fc.id = p_center_id;
  IF v_brand_id IS NULL THEN
    RAISE EXCEPTION 'Center not found';
  END IF;

  IF NOT public.brand_feature_enabled(v_brand_id, 'batches') THEN
    RAISE EXCEPTION 'feature_disabled';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.programs p
    WHERE p.id = p_program_id AND p.brand_id = v_brand_id AND p.deleted_at IS NULL AND p.is_active = true
  ) THEN
    RAISE EXCEPTION 'Program not found';
  END IF;

  PERFORM public.assert_center_program_authorized(p_center_id, p_program_id);

  SELECT l.sort_order INTO v_start_order
  FROM public.levels l
  WHERE l.id = p_level_start_id AND l.program_id = p_program_id;
  SELECT l.sort_order INTO v_end_order
  FROM public.levels l
  WHERE l.id = p_level_end_id AND l.program_id = p_program_id;
  IF v_start_order IS NULL OR v_end_order IS NULL OR v_start_order > v_end_order THEN
    RAISE EXCEPTION 'Invalid level range';
  END IF;

  IF p_batch_id IS NULL THEN
    INSERT INTO public.batches (
      brand_id, center_id, name, program_id,
      level_start_id, level_end_id, is_open_for_enrollment, schedule
    )
    VALUES (
      v_brand_id, p_center_id, trim(p_name), p_program_id,
      p_level_start_id, p_level_end_id, coalesce(p_is_open_for_enrollment, false), coalesce(p_schedule, '{}'::jsonb)
    )
    RETURNING id INTO v_batch_id;
  ELSE
    UPDATE public.batches SET
      name = trim(p_name),
      program_id = p_program_id,
      level_start_id = p_level_start_id,
      level_end_id = p_level_end_id,
      is_open_for_enrollment = coalesce(p_is_open_for_enrollment, false),
      schedule = coalesce(p_schedule, '{}'::jsonb),
      updated_at = now()
    WHERE id = p_batch_id AND center_id = p_center_id AND deleted_at IS NULL
    RETURNING id INTO v_batch_id;
    IF v_batch_id IS NULL THEN
      RAISE EXCEPTION 'Batch not found';
    END IF;
  END IF;

  RETURN v_batch_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.soft_delete_center_batch(p_batch_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_center_id uuid;
  v_brand_id uuid;
BEGIN
  SELECT center_id, brand_id INTO v_center_id, v_brand_id
  FROM public.batches WHERE id = p_batch_id AND deleted_at IS NULL;
  IF v_center_id IS NULL THEN
    RAISE EXCEPTION 'Batch not found';
  END IF;
  IF NOT public.has_center_access(v_center_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF NOT public.brand_feature_enabled(v_brand_id, 'batches') THEN
    RAISE EXCEPTION 'feature_disabled';
  END IF;
  UPDATE public.batches SET deleted_at = now(), updated_at = now() WHERE id = p_batch_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_student_batch_assignments(
  p_student_id uuid,
  p_center_id uuid,
  p_batch_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enrollment_id uuid;
  v_bid uuid;
  v_batch public.batches%ROWTYPE;
  v_brand_id uuid;
BEGIN
  IF NOT public.has_center_access(p_center_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT fc.brand_id INTO v_brand_id FROM public.franchise_centers fc WHERE fc.id = p_center_id;
  IF v_brand_id IS NULL THEN
    RAISE EXCEPTION 'Center not found';
  END IF;
  IF NOT public.brand_feature_enabled(v_brand_id, 'batches') THEN
    RAISE EXCEPTION 'feature_disabled';
  END IF;

  SELECT e.id INTO v_enrollment_id
  FROM public.student_enrollments e
  WHERE e.student_id = p_student_id AND e.center_id = p_center_id AND e.status = 'active'
  LIMIT 1;

  IF v_enrollment_id IS NULL THEN
    RAISE EXCEPTION 'No active enrollment';
  END IF;

  DELETE FROM public.batch_enrollments be
  WHERE be.student_id = p_student_id AND be.center_id = p_center_id
    AND NOT (be.batch_id = ANY (coalesce(p_batch_ids, ARRAY[]::uuid[])));

  FOREACH v_bid IN ARRAY coalesce(p_batch_ids, ARRAY[]::uuid[])
  LOOP
    SELECT * INTO v_batch FROM public.batches b
    WHERE b.id = v_bid AND b.center_id = p_center_id AND b.deleted_at IS NULL;
    IF v_batch.id IS NULL THEN
      RAISE EXCEPTION 'Batch not found';
    END IF;
    PERFORM public.assert_center_program_authorized(v_batch.center_id, v_batch.program_id);

    INSERT INTO public.batch_enrollments (brand_id, center_id, batch_id, student_id, enrollment_id)
    VALUES (v_batch.brand_id, p_center_id, v_bid, p_student_id, v_enrollment_id)
    ON CONFLICT (batch_id, student_id) DO UPDATE
    SET enrollment_id = EXCLUDED.enrollment_id, updated_at = now();
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_student_open_batches(p_brand_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id uuid;
  v_center_id uuid;
BEGIN
  IF NOT public.brand_feature_enabled(p_brand_id, 'batches') THEN
    RETURN '[]'::jsonb;
  END IF;

  v_student_id := public.resolve_student_for_learn(p_brand_id);
  IF v_student_id IS NULL THEN RAISE EXCEPTION 'NO_STUDENT_LINK'; END IF;
  v_center_id := (public.get_student_active_enrollment(v_student_id, p_brand_id)).center_id;

  RETURN coalesce((
    SELECT jsonb_agg(jsonb_build_object(
      'batch_id', b.id,
      'name', b.name,
      'program_name', p.name,
      'level_start', ls.name,
      'level_end', le.name,
      'already_joined', EXISTS (
        SELECT 1 FROM public.batch_enrollments be
        WHERE be.batch_id = b.id AND be.student_id = v_student_id
      )
    ) ORDER BY b.name)
    FROM public.batches b
    JOIN public.programs p ON p.id = b.program_id
    JOIN public.levels ls ON ls.id = b.level_start_id
    JOIN public.levels le ON le.id = b.level_end_id
    WHERE b.center_id = v_center_id
      AND b.deleted_at IS NULL
      AND b.is_open_for_enrollment = true
      AND public.is_program_authorized_for_center(b.center_id, b.program_id)
      AND public.is_center_operational(b.center_id)
  ), '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.join_student_batch(p_batch_id uuid)
RETURNS uuid
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch public.batches%ROWTYPE;
  v_student_id uuid;
  v_enrollment public.student_enrollments%ROWTYPE;
  v_be_id uuid;
  v_brand_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_batch FROM public.batches b
  WHERE b.id = p_batch_id AND b.deleted_at IS NULL;
  IF v_batch.id IS NULL THEN
    RAISE EXCEPTION 'Batch not found';
  END IF;
  IF NOT v_batch.is_open_for_enrollment THEN
    RAISE EXCEPTION 'BATCH_NOT_OPEN';
  END IF;

  v_brand_id := v_batch.brand_id;
  IF NOT public.brand_feature_enabled(v_brand_id, 'batches') THEN
    RAISE EXCEPTION 'feature_disabled';
  END IF;

  PERFORM public.assert_center_operational(v_batch.center_id);

  v_student_id := public.resolve_student_for_learn(v_brand_id);
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'NO_STUDENT_LINK';
  END IF;

  v_enrollment := public.get_student_active_enrollment(v_student_id, v_brand_id);
  IF v_enrollment.center_id <> v_batch.center_id THEN
    RAISE EXCEPTION 'WRONG_CENTER';
  END IF;

  PERFORM public.assert_center_program_authorized(v_batch.center_id, v_batch.program_id);

  INSERT INTO public.batch_enrollments (brand_id, center_id, batch_id, student_id, enrollment_id)
  VALUES (v_batch.brand_id, v_batch.center_id, v_batch.id, v_student_id, v_enrollment.id)
  ON CONFLICT (batch_id, student_id) DO UPDATE
  SET enrollment_id = EXCLUDED.enrollment_id, updated_at = now()
  RETURNING id INTO v_be_id;

  INSERT INTO public.batch_join_events (
    brand_id, center_id, batch_id, student_id, batch_enrollment_id
  )
  VALUES (v_batch.brand_id, v_batch.center_id, v_batch.id, v_student_id, v_be_id);

  RETURN v_be_id;
END;
$$;
