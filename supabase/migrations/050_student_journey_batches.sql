-- Student journey: franchise program authorization, curriculum-scoped batches (level range),
-- student self-join, in-app center alerts, multi-ladder progress RPC.

-- ---------------------------------------------------------------------------
-- Center program authorization (franchise agreement)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.center_program_enablement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  center_id uuid NOT NULL REFERENCES public.franchise_centers(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  authorized_at timestamptz NOT NULL DEFAULT now(),
  authorized_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE (center_id, program_id)
);

CREATE INDEX IF NOT EXISTS idx_center_program_enablement_center
  ON public.center_program_enablement (center_id);

DROP TRIGGER IF EXISTS center_program_enablement_audit ON public.center_program_enablement;
CREATE TRIGGER center_program_enablement_audit
  BEFORE INSERT OR UPDATE ON public.center_program_enablement
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

ALTER TABLE public.center_program_enablement ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS center_program_enablement_brand ON public.center_program_enablement;
CREATE POLICY center_program_enablement_brand ON public.center_program_enablement
  FOR ALL TO authenticated
  USING (public.has_brand_access(brand_id) OR public.is_platform_admin())
  WITH CHECK (public.has_brand_access(brand_id) OR public.is_platform_admin());

DROP POLICY IF EXISTS center_program_enablement_center_read ON public.center_program_enablement;
CREATE POLICY center_program_enablement_center_read ON public.center_program_enablement
  FOR SELECT TO authenticated
  USING (public.has_center_access(center_id) OR public.has_brand_access(brand_id) OR public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Batch extensions: one curriculum + level range, soft delete, open enrollment
-- ---------------------------------------------------------------------------

ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_open_for_enrollment boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS curriculum_version_id uuid REFERENCES public.curriculum_versions(id),
  ADD COLUMN IF NOT EXISTS level_start_id uuid REFERENCES public.levels(id),
  ADD COLUMN IF NOT EXISTS level_end_id uuid REFERENCES public.levels(id);

CREATE INDEX IF NOT EXISTS idx_batches_center_active
  ON public.batches (center_id) WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- Self-join audit for in-app center alerts
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.batch_join_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  center_id uuid NOT NULL REFERENCES public.franchise_centers(id) ON DELETE CASCADE,
  batch_id uuid NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  batch_enrollment_id uuid NOT NULL REFERENCES public.batch_enrollments(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_batch_join_events_center_unseen
  ON public.batch_join_events (center_id) WHERE seen_at IS NULL;

ALTER TABLE public.batch_join_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS batch_join_events_center ON public.batch_join_events;
CREATE POLICY batch_join_events_center ON public.batch_join_events
  FOR ALL TO authenticated
  USING (public.has_center_access(center_id) OR public.has_brand_access(brand_id) OR public.is_platform_admin())
  WITH CHECK (public.has_center_access(center_id) OR public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_program_authorized_for_center(
  p_center_id uuid,
  p_program_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.center_program_enablement cpe
    WHERE cpe.center_id = p_center_id AND cpe.program_id = p_program_id
  );
$$;

REVOKE ALL ON FUNCTION public.is_program_authorized_for_center(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_program_authorized_for_center(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.assert_center_curriculum_authorized(
  p_center_id uuid,
  p_curriculum_version_id uuid
)
RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_program_id uuid;
BEGIN
  IF p_curriculum_version_id IS NULL THEN
    RETURN;
  END IF;
  SELECT cv.program_id INTO v_program_id
  FROM public.curriculum_versions cv WHERE cv.id = p_curriculum_version_id;
  IF v_program_id IS NULL THEN
    RAISE EXCEPTION 'Curriculum not found';
  END IF;
  IF NOT public.is_program_authorized_for_center(p_center_id, v_program_id) THEN
    RAISE EXCEPTION 'PROGRAM_NOT_AUTHORIZED';
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- Brand: sync authorized programs for a center
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.sync_center_program_enablement(
  p_center_id uuid,
  p_program_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_id uuid;
BEGIN
  SELECT fc.brand_id INTO v_brand_id FROM public.franchise_centers fc WHERE fc.id = p_center_id;
  IF v_brand_id IS NULL OR NOT public.has_brand_access(v_brand_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  DELETE FROM public.center_program_enablement cpe
  WHERE cpe.center_id = p_center_id
    AND NOT (cpe.program_id = ANY (coalesce(p_program_ids, ARRAY[]::uuid[])));

  INSERT INTO public.center_program_enablement (brand_id, center_id, program_id, authorized_by)
  SELECT v_brand_id, p_center_id, pid, auth.uid()
  FROM unnest(coalesce(p_program_ids, ARRAY[]::uuid[])) AS pid
  WHERE EXISTS (
    SELECT 1 FROM public.programs p
    WHERE p.id = pid AND p.brand_id = v_brand_id AND p.deleted_at IS NULL
  )
  ON CONFLICT (center_id, program_id) DO UPDATE
  SET updated_at = now(), authorized_by = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.sync_center_program_enablement(uuid, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_center_program_enablement(uuid, uuid[]) TO authenticated;

-- ---------------------------------------------------------------------------
-- Center: upsert batch (validates authorization + level range)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.upsert_center_batch(
  p_batch_id uuid,
  p_center_id uuid,
  p_name text,
  p_curriculum_version_id uuid,
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
  v_row public.batches%ROWTYPE;
BEGIN
  IF NOT public.has_center_access(p_center_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT fc.brand_id INTO v_brand_id FROM public.franchise_centers fc WHERE fc.id = p_center_id;
  IF v_brand_id IS NULL THEN
    RAISE EXCEPTION 'Center not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.curriculum_versions cv
    WHERE cv.id = p_curriculum_version_id AND cv.brand_id = v_brand_id AND cv.status = 'published'
  ) THEN
    RAISE EXCEPTION 'Published curriculum not found';
  END IF;

  PERFORM public.assert_center_curriculum_authorized(p_center_id, p_curriculum_version_id);

  SELECT l.sort_order INTO v_start_order FROM public.levels l WHERE l.id = p_level_start_id;
  SELECT l.sort_order INTO v_end_order FROM public.levels l WHERE l.id = p_level_end_id;
  IF v_start_order IS NULL OR v_end_order IS NULL OR v_start_order > v_end_order THEN
    RAISE EXCEPTION 'Invalid level range';
  END IF;

  IF p_batch_id IS NULL THEN
    INSERT INTO public.batches (
      brand_id, center_id, name, curriculum_version_id,
      level_start_id, level_end_id, is_open_for_enrollment, schedule
    )
    VALUES (
      v_brand_id, p_center_id, trim(p_name), p_curriculum_version_id,
      p_level_start_id, p_level_end_id, coalesce(p_is_open_for_enrollment, false), coalesce(p_schedule, '{}'::jsonb)
    )
    RETURNING id INTO v_batch_id;
  ELSE
    UPDATE public.batches SET
      name = trim(p_name),
      curriculum_version_id = p_curriculum_version_id,
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

REVOKE ALL ON FUNCTION public.upsert_center_batch(uuid, uuid, text, uuid, uuid, uuid, boolean, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_center_batch(uuid, uuid, text, uuid, uuid, uuid, boolean, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.soft_delete_center_batch(p_batch_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_center_id uuid;
BEGIN
  SELECT center_id INTO v_center_id FROM public.batches WHERE id = p_batch_id AND deleted_at IS NULL;
  IF v_center_id IS NULL THEN
    RAISE EXCEPTION 'Batch not found';
  END IF;
  IF NOT public.has_center_access(v_center_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.batches SET deleted_at = now(), updated_at = now() WHERE id = p_batch_id;
END;
$$;

REVOKE ALL ON FUNCTION public.soft_delete_center_batch(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.soft_delete_center_batch(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Student self-join batch
-- ---------------------------------------------------------------------------

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
  v_student_id := public.resolve_student_for_learn(v_brand_id);
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'NO_STUDENT_LINK';
  END IF;

  v_enrollment := public.get_student_active_enrollment(v_student_id, v_brand_id);
  IF v_enrollment.center_id <> v_batch.center_id THEN
    RAISE EXCEPTION 'WRONG_CENTER';
  END IF;

  PERFORM public.assert_center_curriculum_authorized(v_batch.center_id, v_batch.curriculum_version_id);

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

REVOKE ALL ON FUNCTION public.join_student_batch(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_student_batch(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_center_unseen_batch_joins(p_center_id uuid)
RETURNS int
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_center_access(p_center_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN (
    SELECT count(*)::int FROM public.batch_join_events e
    WHERE e.center_id = p_center_id AND e.seen_at IS NULL
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_center_unseen_batch_joins(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_center_unseen_batch_joins(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.mark_batch_joins_seen(p_center_id uuid)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_center_access(p_center_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.batch_join_events
  SET seen_at = now()
  WHERE center_id = p_center_id AND seen_at IS NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_batch_joins_seen(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_batch_joins_seen(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Sync student batch assignments (center staff)
-- ---------------------------------------------------------------------------

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
  v_brand_id uuid;
  v_bid uuid;
  v_batch public.batches%ROWTYPE;
BEGIN
  IF NOT public.has_center_access(p_center_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT e.id, e.brand_id INTO v_enrollment_id, v_brand_id
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
    PERFORM public.assert_center_curriculum_authorized(v_batch.center_id, v_batch.curriculum_version_id);

    INSERT INTO public.batch_enrollments (brand_id, center_id, batch_id, student_id, enrollment_id)
    VALUES (v_batch.brand_id, p_center_id, v_bid, p_student_id, v_enrollment_id)
    ON CONFLICT (batch_id, student_id) DO UPDATE
    SET enrollment_id = EXCLUDED.enrollment_id, updated_at = now();
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_student_batch_assignments(uuid, uuid, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_student_batch_assignments(uuid, uuid, uuid[]) TO authenticated;

-- ---------------------------------------------------------------------------
-- Multi-ladder progress for learn portal
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_student_program_ladders(p_brand_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id uuid;
  v_result jsonb := '[]'::jsonb;
  v_cv record;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_student_id := public.resolve_student_for_learn(p_brand_id);
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'NO_STUDENT_LINK';
  END IF;
  PERFORM public.get_student_active_enrollment(v_student_id, p_brand_id);

  SELECT coalesce(jsonb_agg(ladder ORDER BY ladder->>'program_name'), '[]'::jsonb) INTO v_result
  FROM (
    SELECT jsonb_build_object(
      'curriculum_version_id', cv.id,
      'program_id', p.id,
      'program_name', p.name,
      'curriculum_label', 'v' || cv.version_number::text || ' — ' || p.name,
      'batches', (
        SELECT coalesce(jsonb_agg(jsonb_build_object(
          'batch_id', b.id,
          'batch_name', b.name,
          'level_start', ls.name,
          'level_end', le.name
        ) ORDER BY b.name), '[]'::jsonb)
        FROM public.batch_enrollments be
        JOIN public.batches b ON b.id = be.batch_id AND b.deleted_at IS NULL
        JOIN public.levels ls ON ls.id = b.level_start_id
        JOIN public.levels le ON le.id = b.level_end_id
        WHERE be.student_id = v_student_id AND b.curriculum_version_id = cv.id
      ),
      'curriculum_ladder', (
        SELECT jsonb_build_object(
          'current_level_id', (
            SELECT l.id FROM public.levels l
            LEFT JOIN public.student_level_progress slp ON slp.student_id = v_student_id
              AND (slp.level_id = l.id OR slp.level_name = l.name)
            WHERE l.curriculum_version_id = cv.id
              AND coalesce(slp.status, 'not_started') <> 'completed'
            ORDER BY l.sort_order ASC LIMIT 1
          ),
          'completion_pct', (
            SELECT CASE WHEN count(*) = 0 THEN 0
              ELSE round((count(*) FILTER (WHERE coalesce(slp.status, 'not_started') = 'completed'))::numeric / count(*)::numeric * 100, 1)
            END
            FROM public.levels l
            LEFT JOIN public.student_level_progress slp ON slp.student_id = v_student_id
              AND (slp.level_id = l.id OR slp.level_name = l.name)
            WHERE l.curriculum_version_id = cv.id
          ),
          'levels', coalesce((
            SELECT jsonb_agg(jsonb_build_object(
              'level_id', l.id,
              'name', l.name,
              'sort_order', l.sort_order,
              'status', coalesce(slp.status, 'not_started'),
              'completed_at', slp.completed_at,
              'abacus_level_code', l.abacus_level_code
            ) ORDER BY l.sort_order)
            FROM public.levels l
            LEFT JOIN public.student_level_progress slp ON slp.student_id = v_student_id
              AND (slp.level_id = l.id OR slp.level_name = l.name)
            WHERE l.curriculum_version_id = cv.id
          ), '[]'::jsonb)
        )
      ),
      'assessments', coalesce((
        SELECT jsonb_agg(jsonb_build_object(
          'id', a.id,
          'assessment_type', a.assessment_type,
          'score', a.score,
          'max_score', a.max_score,
          'assessed_at', a.assessed_at,
          'notes', a.notes,
          'level_id', a.level_id
        ) ORDER BY a.assessed_at DESC)
        FROM public.student_assessments a
        WHERE a.student_id = v_student_id AND a.visible_to_student = true
          AND (a.level_id IS NULL OR a.level_id IN (SELECT id FROM public.levels WHERE curriculum_version_id = cv.id))
      ), '[]'::jsonb)
    ) AS ladder
    FROM (
      SELECT DISTINCT b.curriculum_version_id AS cv_id
      FROM public.batch_enrollments be
      JOIN public.batches b ON b.id = be.batch_id AND b.deleted_at IS NULL
      WHERE be.student_id = v_student_id AND b.brand_id = p_brand_id
      UNION
      SELECT e.curriculum_version_id FROM public.student_enrollments e
      WHERE e.student_id = v_student_id AND e.brand_id = p_brand_id AND e.status = 'active'
        AND e.curriculum_version_id IS NOT NULL
    ) src
    JOIN public.curriculum_versions cv ON cv.id = src.cv_id
    JOIN public.programs p ON p.id = cv.program_id
  ) sub;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_student_program_ladders(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_student_program_ladders(uuid) TO authenticated;

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
    JOIN public.curriculum_versions cv ON cv.id = b.curriculum_version_id
    JOIN public.programs p ON p.id = cv.program_id
    JOIN public.levels ls ON ls.id = b.level_start_id
    JOIN public.levels le ON le.id = b.level_end_id
    WHERE b.center_id = v_center_id
      AND b.deleted_at IS NULL
      AND b.is_open_for_enrollment = true
      AND public.is_program_authorized_for_center(b.center_id, p.id)
  ), '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.get_student_open_batches(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_student_open_batches(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
