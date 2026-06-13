-- Franchise center lifecycle (suspend/re-enable) + version-level curriculum enablement

-- ---------------------------------------------------------------------------
-- Operational helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_center_operational(p_center_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.franchise_centers fc
    WHERE fc.id = p_center_id
      AND fc.status = 'active'
      AND fc.deleted_at IS NULL
  );
$$;

REVOKE ALL ON FUNCTION public.is_center_operational(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_center_operational(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.assert_center_operational(p_center_id uuid)
RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_center_operational(p_center_id) THEN
    RAISE EXCEPTION 'CENTER_NOT_OPERATIONAL';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.assert_center_operational(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assert_center_operational(uuid) TO authenticated;

-- Center staff memberships only resolve to operational centers; brand oversight unchanged.
CREATE OR REPLACE FUNCTION public.user_center_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT m.center_id
  FROM public.memberships m
  JOIN public.franchise_centers fc ON fc.id = m.center_id
  WHERE m.user_id = auth.uid()
    AND m.status = 'active'
    AND m.center_id IS NOT NULL
    AND fc.status = 'active'
    AND fc.deleted_at IS NULL
  UNION
  SELECT fc.id
  FROM public.franchise_centers fc
  WHERE fc.brand_id IN (SELECT public.user_brand_ids())
    AND EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.scope_type = 'brand'
        AND m.brand_id = fc.brand_id
        AND m.status = 'active'
        AND m.role_key IN ('brand_owner', 'brand_admin')
    );
$$;

-- ---------------------------------------------------------------------------
-- Status audit trail
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.center_status_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  center_id uuid NOT NULL REFERENCES public.franchise_centers(id) ON DELETE CASCADE,
  from_status public.center_status,
  to_status public.center_status NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_center_status_events_center
  ON public.center_status_events (center_id, created_at DESC);

ALTER TABLE public.center_status_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS center_status_events_brand ON public.center_status_events;
CREATE POLICY center_status_events_brand ON public.center_status_events
  FOR SELECT TO authenticated
  USING (public.has_brand_access(brand_id) OR public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Brand: suspend / re-enable franchise
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_franchise_center_status(
  p_center_id uuid,
  p_status public.center_status,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_id uuid;
  v_from public.center_status;
BEGIN
  IF p_center_id IS NULL THEN
    RAISE EXCEPTION 'center_id is required';
  END IF;

  IF p_status NOT IN ('active', 'suspended') THEN
    RAISE EXCEPTION 'Only active and suspended transitions are allowed';
  END IF;

  SELECT fc.brand_id, fc.status
  INTO v_brand_id, v_from
  FROM public.franchise_centers fc
  WHERE fc.id = p_center_id AND fc.deleted_at IS NULL;

  IF v_brand_id IS NULL THEN
    RAISE EXCEPTION 'Center not found';
  END IF;

  IF NOT public.has_brand_access(v_brand_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF v_from = p_status THEN
    RETURN;
  END IF;

  UPDATE public.franchise_centers
  SET status = p_status, updated_at = now()
  WHERE id = p_center_id;

  INSERT INTO public.center_status_events (brand_id, center_id, from_status, to_status, reason, created_by)
  VALUES (v_brand_id, p_center_id, v_from, p_status, nullif(trim(coalesce(p_reason, '')), ''), auth.uid());
END;
$$;

REVOKE ALL ON FUNCTION public.set_franchise_center_status(uuid, public.center_status, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_franchise_center_status(uuid, public.center_status, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Version-level curriculum enablement
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.center_curriculum_enablement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  center_id uuid NOT NULL REFERENCES public.franchise_centers(id) ON DELETE CASCADE,
  curriculum_version_id uuid NOT NULL REFERENCES public.curriculum_versions(id) ON DELETE CASCADE,
  authorized_at timestamptz NOT NULL DEFAULT now(),
  authorized_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE (center_id, curriculum_version_id)
);

CREATE INDEX IF NOT EXISTS idx_center_curriculum_enablement_center
  ON public.center_curriculum_enablement (center_id);

DROP TRIGGER IF EXISTS center_curriculum_enablement_audit ON public.center_curriculum_enablement;
CREATE TRIGGER center_curriculum_enablement_audit
  BEFORE INSERT OR UPDATE ON public.center_curriculum_enablement
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

ALTER TABLE public.center_curriculum_enablement ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS center_curriculum_enablement_brand ON public.center_curriculum_enablement;
CREATE POLICY center_curriculum_enablement_brand ON public.center_curriculum_enablement
  FOR ALL TO authenticated
  USING (public.has_brand_access(brand_id) OR public.is_platform_admin())
  WITH CHECK (public.has_brand_access(brand_id) OR public.is_platform_admin());

DROP POLICY IF EXISTS center_curriculum_enablement_center_read ON public.center_curriculum_enablement;
CREATE POLICY center_curriculum_enablement_center_read ON public.center_curriculum_enablement
  FOR SELECT TO authenticated
  USING (public.has_center_access(center_id) OR public.has_brand_access(brand_id) OR public.is_platform_admin());

-- Backfill from existing program enablement → all published versions per program
INSERT INTO public.center_curriculum_enablement (brand_id, center_id, curriculum_version_id, authorized_by)
SELECT cpe.brand_id, cpe.center_id, cv.id, cpe.authorized_by
FROM public.center_program_enablement cpe
JOIN public.curriculum_versions cv
  ON cv.program_id = cpe.program_id
 AND cv.brand_id = cpe.brand_id
 AND cv.status = 'published'
ON CONFLICT (center_id, curriculum_version_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_curriculum_version_authorized_for_center(
  p_center_id uuid,
  p_curriculum_version_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.center_curriculum_enablement cce
    WHERE cce.center_id = p_center_id
      AND cce.curriculum_version_id = p_curriculum_version_id
  );
$$;

REVOKE ALL ON FUNCTION public.is_curriculum_version_authorized_for_center(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_curriculum_version_authorized_for_center(uuid, uuid) TO authenticated;

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
BEGIN
  IF p_curriculum_version_id IS NULL THEN
    RETURN;
  END IF;

  IF NOT public.is_curriculum_version_authorized_for_center(p_center_id, p_curriculum_version_id) THEN
    RAISE EXCEPTION 'PROGRAM_NOT_AUTHORIZED';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public._sync_center_programs_from_curricula(p_center_id uuid, v_brand_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.center_program_enablement cpe
  WHERE cpe.center_id = p_center_id
    AND cpe.program_id NOT IN (
      SELECT cv.program_id
      FROM public.center_curriculum_enablement cce
      JOIN public.curriculum_versions cv ON cv.id = cce.curriculum_version_id
      WHERE cce.center_id = p_center_id
    );

  INSERT INTO public.center_program_enablement (brand_id, center_id, program_id, authorized_by)
  SELECT DISTINCT v_brand_id, p_center_id, cv.program_id, auth.uid()
  FROM public.center_curriculum_enablement cce
  JOIN public.curriculum_versions cv ON cv.id = cce.curriculum_version_id
  WHERE cce.center_id = p_center_id
  ON CONFLICT (center_id, program_id) DO UPDATE
  SET updated_at = now(), authorized_by = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_center_curriculum_enablement(
  p_center_id uuid,
  p_curriculum_version_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_id uuid;
  v_removed uuid;
BEGIN
  SELECT fc.brand_id INTO v_brand_id
  FROM public.franchise_centers fc
  WHERE fc.id = p_center_id AND fc.deleted_at IS NULL;

  IF v_brand_id IS NULL OR NOT public.has_brand_access(v_brand_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  FOR v_removed IN
    SELECT cce.curriculum_version_id
    FROM public.center_curriculum_enablement cce
    WHERE cce.center_id = p_center_id
      AND NOT (cce.curriculum_version_id = ANY (coalesce(p_curriculum_version_ids, ARRAY[]::uuid[])))
  LOOP
    IF EXISTS (
      SELECT 1 FROM public.batches b
      WHERE b.center_id = p_center_id
        AND b.curriculum_version_id = v_removed
        AND b.deleted_at IS NULL
    ) THEN
      RAISE EXCEPTION 'CURRICULUM_VERSION_IN_USE';
    END IF;
  END LOOP;

  DELETE FROM public.center_curriculum_enablement cce
  WHERE cce.center_id = p_center_id
    AND NOT (cce.curriculum_version_id = ANY (coalesce(p_curriculum_version_ids, ARRAY[]::uuid[])));

  INSERT INTO public.center_curriculum_enablement (brand_id, center_id, curriculum_version_id, authorized_by)
  SELECT v_brand_id, p_center_id, vid, auth.uid()
  FROM unnest(coalesce(p_curriculum_version_ids, ARRAY[]::uuid[])) AS vid
  WHERE EXISTS (
    SELECT 1 FROM public.curriculum_versions cv
    WHERE cv.id = vid
      AND cv.brand_id = v_brand_id
      AND cv.status = 'published'
  )
  ON CONFLICT (center_id, curriculum_version_id) DO UPDATE
  SET updated_at = now(), authorized_by = auth.uid();

  PERFORM public._sync_center_programs_from_curricula(p_center_id, v_brand_id);
END;
$$;

REVOKE ALL ON FUNCTION public.sync_center_curriculum_enablement(uuid, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_center_curriculum_enablement(uuid, uuid[]) TO authenticated;

-- ---------------------------------------------------------------------------
-- Pin enrollment curriculum: require version authorization
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.pin_enrollment_curriculum(
  p_enrollment_id uuid,
  p_curriculum_version_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enrollment public.student_enrollments%ROWTYPE;
  v_brand_id uuid;
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
    SELECT 1 FROM public.curriculum_versions cv
    WHERE cv.id = p_curriculum_version_id AND cv.brand_id = v_enrollment.brand_id
  ) THEN
    RAISE EXCEPTION 'Curriculum version not found';
  END IF;

  PERFORM public.assert_center_curriculum_authorized(v_enrollment.center_id, p_curriculum_version_id);

  UPDATE public.student_enrollments
  SET curriculum_version_id = p_curriculum_version_id, updated_at = now()
  WHERE id = p_enrollment_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Student open batches: filter by version enablement
-- ---------------------------------------------------------------------------

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
      AND public.is_curriculum_version_authorized_for_center(b.center_id, b.curriculum_version_id)
      AND public.is_center_operational(b.center_id)
  ), '[]'::jsonb);
END;
$$;

-- Block student self-join when center not operational
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

  PERFORM public.assert_center_operational(v_batch.center_id);

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

NOTIFY pgrst, 'reload schema';
