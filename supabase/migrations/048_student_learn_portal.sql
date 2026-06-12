-- Student learn portal v2: student auth, enrollment gate, comprehensive dashboard RPCs, competition registration

-- ---------------------------------------------------------------------------
-- Student auth columns
-- ---------------------------------------------------------------------------

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS login_email text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_students_user_brand
  ON public.students (brand_id, user_id) WHERE user_id IS NOT NULL AND deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- Competition registration extensions
-- ---------------------------------------------------------------------------

ALTER TABLE public.brand_competitions
  ADD COLUMN IF NOT EXISTS fee_type text NOT NULL DEFAULT 'free'
    CHECK (fee_type IN ('free', 'paid')),
  ADD COLUMN IF NOT EXISTS fee_amount numeric(10, 2),
  ADD COLUMN IF NOT EXISTS fee_currency text NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS registration_opens_at timestamptz,
  ADD COLUMN IF NOT EXISTS registration_closes_at timestamptz,
  ADD COLUMN IF NOT EXISTS registration_mode text NOT NULL DEFAULT 'open'
    CHECK (registration_mode IN ('closed', 'open', 'invite_only')),
  ADD COLUMN IF NOT EXISTS max_participants int,
  ADD COLUMN IF NOT EXISTS eligibility_rules jsonb NOT NULL DEFAULT '{"requires_active_enrollment": true}'::jsonb;

ALTER TABLE public.student_competition_entries
  ADD COLUMN IF NOT EXISTS enrollment_id uuid REFERENCES public.student_enrollments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rank_position int,
  ADD COLUMN IF NOT EXISTS score numeric(10, 2);

ALTER TABLE public.student_assessments
  ADD COLUMN IF NOT EXISTS enrollment_id uuid REFERENCES public.student_enrollments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS visible_to_student boolean NOT NULL DEFAULT true;

-- Backfill enrollment_id on progress and assessments
UPDATE public.student_level_progress slp
SET enrollment_id = e.id
FROM public.student_enrollments e
WHERE slp.enrollment_id IS NULL
  AND e.student_id = slp.student_id
  AND e.center_id = slp.center_id
  AND e.status = 'active';

UPDATE public.student_assessments sa
SET enrollment_id = e.id
FROM public.student_enrollments e
WHERE sa.enrollment_id IS NULL
  AND e.student_id = sa.student_id
  AND e.center_id = sa.center_id
  AND e.status = 'active';

UPDATE public.student_competition_entries sce
SET enrollment_id = e.id
FROM public.student_enrollments e
WHERE sce.enrollment_id IS NULL
  AND e.student_id = sce.student_id
  AND e.center_id = sce.center_id
  AND e.status = 'active';

-- ---------------------------------------------------------------------------
-- Competition registrations
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.student_competition_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  center_id uuid NOT NULL REFERENCES public.franchise_centers(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  enrollment_id uuid NOT NULL REFERENCES public.student_enrollments(id) ON DELETE CASCADE,
  competition_id uuid NOT NULL REFERENCES public.brand_competitions(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'registered'
    CHECK (status IN ('registered', 'waitlisted', 'withdrawn', 'confirmed', 'cancelled_by_center')),
  registered_at timestamptz NOT NULL DEFAULT now(),
  registered_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE (student_id, competition_id)
);

CREATE INDEX IF NOT EXISTS idx_comp_registrations_competition
  ON public.student_competition_registrations (competition_id, status);

DROP TRIGGER IF EXISTS student_competition_registrations_audit ON public.student_competition_registrations;
CREATE TRIGGER student_competition_registrations_audit
  BEFORE INSERT OR UPDATE ON public.student_competition_registrations
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

-- Required before RLS policies that reference is_student_self
CREATE OR REPLACE FUNCTION public.is_student_self(p_student_id uuid, p_brand_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = p_student_id
      AND s.user_id = auth.uid()
      AND s.deleted_at IS NULL
      AND (p_brand_id IS NULL OR s.brand_id = p_brand_id)
  );
$$;

REVOKE ALL ON FUNCTION public.is_student_self(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_student_self(uuid, uuid) TO authenticated;

ALTER TABLE public.student_competition_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS student_competition_registrations_staff ON public.student_competition_registrations;
CREATE POLICY student_competition_registrations_staff ON public.student_competition_registrations
  FOR SELECT TO authenticated
  USING (
    public.has_center_access(center_id)
    OR public.has_brand_access(brand_id)
    OR public.is_platform_admin()
    OR public.is_student_self(student_id, brand_id)
  );

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.resolve_student_for_learn(p_brand_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id uuid;
  v_email text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT s.id INTO v_student_id
  FROM public.students s
  WHERE s.brand_id = p_brand_id
    AND s.user_id = auth.uid()
    AND s.deleted_at IS NULL
  LIMIT 1;

  IF v_student_id IS NOT NULL THEN
    RETURN v_student_id;
  END IF;

  SELECT u.email INTO v_email FROM auth.users u WHERE u.id = auth.uid();

  IF v_email IS NOT NULL THEN
    UPDATE public.students s
    SET user_id = auth.uid(), updated_at = now()
    WHERE s.brand_id = p_brand_id
      AND s.deleted_at IS NULL
      AND s.user_id IS NULL
      AND lower(trim(s.login_email)) = lower(trim(v_email))
    RETURNING s.id INTO v_student_id;
  END IF;

  RETURN v_student_id;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_student_for_learn(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_student_for_learn(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_student_active_enrollment(p_student_id uuid, p_brand_id uuid)
RETURNS public.student_enrollments
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.student_enrollments%ROWTYPE;
BEGIN
  SELECT e.* INTO v_row
  FROM public.student_enrollments e
  WHERE e.student_id = p_student_id
    AND e.brand_id = p_brand_id
    AND e.status = 'active'
    AND e.center_id IS NOT NULL
  ORDER BY e.enrolled_at DESC
  LIMIT 1;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'NO_ACTIVE_ENROLLMENT';
  END IF;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.get_student_active_enrollment(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_student_active_enrollment(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.link_student_auth_user(p_student_id uuid, p_brand_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT u.email INTO v_email FROM auth.users u WHERE u.id = auth.uid();

  IF NOT EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = p_student_id AND s.brand_id = p_brand_id AND s.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Student not found';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.brand_id = p_brand_id AND s.user_id = auth.uid() AND s.id <> p_student_id AND s.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Auth user already linked to another student';
  END IF;

  UPDATE public.students
  SET user_id = auth.uid(),
      login_email = coalesce(login_email, v_email),
      updated_at = now()
  WHERE id = p_student_id AND brand_id = p_brand_id AND deleted_at IS NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.link_student_auth_user(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.link_student_auth_user(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.invite_student_portal_access(
  p_student_id uuid,
  p_login_email text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_center_id uuid;
  v_email text;
BEGIN
  v_email := nullif(trim(coalesce(p_login_email, '')), '');
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'login_email is required';
  END IF;

  SELECT e.center_id INTO v_center_id
  FROM public.student_enrollments e
  WHERE e.student_id = p_student_id AND e.status = 'active'
  ORDER BY e.enrolled_at DESC
  LIMIT 1;

  IF v_center_id IS NULL OR NOT public.has_center_access(v_center_id) THEN
    IF NOT public.is_platform_admin() THEN
      RAISE EXCEPTION 'Not authorized';
    END IF;
  END IF;

  UPDATE public.students
  SET login_email = v_email, updated_at = now()
  WHERE id = p_student_id AND deleted_at IS NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.invite_student_portal_access(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.invite_student_portal_access(uuid, text) TO authenticated;

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
BEGIN
  SELECT * INTO v_enrollment FROM public.student_enrollments WHERE id = p_enrollment_id;
  IF v_enrollment.id IS NULL THEN
    RAISE EXCEPTION 'Enrollment not found';
  END IF;
  IF NOT public.has_center_access(v_enrollment.center_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.curriculum_versions cv
    WHERE cv.id = p_curriculum_version_id AND cv.brand_id = v_enrollment.brand_id
  ) THEN
    RAISE EXCEPTION 'Curriculum version not found';
  END IF;

  UPDATE public.student_enrollments
  SET curriculum_version_id = p_curriculum_version_id, updated_at = now()
  WHERE id = p_enrollment_id;
END;
$$;

REVOKE ALL ON FUNCTION public.pin_enrollment_curriculum(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pin_enrollment_curriculum(uuid, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Updated convert_lead_to_student
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.convert_lead_to_student(
  p_lead_id uuid,
  p_overrides jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead public.leads%ROWTYPE;
  v_parent_id uuid;
  v_student_id uuid;
  v_parent_name text;
  v_child_name text;
  v_school_name text;
  v_city text;
  v_pincode text;
  v_login_email text;
BEGIN
  SELECT * INTO v_lead FROM public.leads WHERE id = p_lead_id FOR UPDATE;
  IF v_lead.id IS NULL OR v_lead.center_id IS NULL OR NOT public.has_center_access(v_lead.center_id) THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;
  IF v_lead.status = 'converted' THEN
    RAISE EXCEPTION 'Already converted';
  END IF;

  v_parent_name := coalesce(
    nullif(trim(p_overrides ->> 'parent_name'), ''),
    coalesce(v_lead.parent_name, v_lead.full_name)
  );
  v_child_name := coalesce(nullif(trim(p_overrides ->> 'child_name'), ''), coalesce(v_lead.child_name, 'Student'));
  v_school_name := coalesce(nullif(trim(p_overrides ->> 'school_name'), ''), v_lead.school_name);
  v_city := coalesce(nullif(trim(p_overrides ->> 'city'), ''), v_lead.city);
  v_pincode := coalesce(nullif(trim(p_overrides ->> 'pincode'), ''), v_lead.pincode);
  v_login_email := nullif(trim(p_overrides ->> 'student_login_email'), '');

  INSERT INTO public.parents (brand_id, full_name, email, phone_e164)
  VALUES (
    v_lead.brand_id,
    v_parent_name,
    v_lead.email,
    coalesce(v_lead.whatsapp_e164, v_lead.phone_e164)
  )
  RETURNING id INTO v_parent_id;

  INSERT INTO public.students (brand_id, full_name, date_of_birth, source_lead_id, login_email)
  VALUES (
    v_lead.brand_id,
    v_child_name,
    coalesce((p_overrides ->> 'child_dob')::date, v_lead.child_dob),
    v_lead.id,
    v_login_email
  )
  RETURNING id INTO v_student_id;

  INSERT INTO public.parent_student_links (brand_id, parent_id, student_id)
  VALUES (v_lead.brand_id, v_parent_id, v_student_id);

  INSERT INTO public.student_profiles (brand_id, student_id, school_name, city, pincode)
  VALUES (v_lead.brand_id, v_student_id, v_school_name, v_city, v_pincode);

  INSERT INTO public.student_enrollments (brand_id, center_id, student_id, status)
  VALUES (v_lead.brand_id, v_lead.center_id, v_student_id, 'active');

  UPDATE public.leads SET status = 'converted', updated_at = now() WHERE id = p_lead_id;

  RETURN v_student_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Updated record_student_level_progress
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.record_student_level_progress(
  p_center_id uuid,
  p_student_id uuid,
  p_level_name text,
  p_status text DEFAULT 'in_progress',
  p_level_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_id uuid;
  v_enrollment_id uuid;
  v_level_name text;
  v_id uuid;
BEGIN
  IF NOT public.has_center_access(p_center_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT fc.brand_id INTO v_brand_id FROM public.franchise_centers fc
  WHERE fc.id = p_center_id AND fc.deleted_at IS NULL;
  IF v_brand_id IS NULL THEN RAISE EXCEPTION 'Center not found'; END IF;

  SELECT e.id INTO v_enrollment_id
  FROM public.student_enrollments e
  WHERE e.student_id = p_student_id AND e.center_id = p_center_id AND e.status = 'active'
  ORDER BY e.enrolled_at DESC LIMIT 1;
  IF v_enrollment_id IS NULL THEN RAISE EXCEPTION 'No active enrollment'; END IF;

  IF p_level_id IS NOT NULL THEN
    SELECT l.name INTO v_level_name FROM public.levels l WHERE l.id = p_level_id;
    IF v_level_name IS NULL THEN RAISE EXCEPTION 'Level not found'; END IF;
  ELSE
    v_level_name := trim(p_level_name);
    IF v_level_name = '' THEN RAISE EXCEPTION 'level_name is required'; END IF;
  END IF;

  INSERT INTO public.student_level_progress (
    brand_id, center_id, student_id, enrollment_id, level_id, level_name, status, completed_at
  )
  VALUES (
    v_brand_id, p_center_id, p_student_id, v_enrollment_id, p_level_id, v_level_name,
    coalesce(p_status, 'in_progress'),
    CASE WHEN coalesce(p_status, 'in_progress') = 'completed' THEN now() ELSE NULL END
  )
  ON CONFLICT (student_id, level_name) DO UPDATE
  SET status = EXCLUDED.status,
      level_id = coalesce(EXCLUDED.level_id, student_level_progress.level_id),
      enrollment_id = EXCLUDED.enrollment_id,
      completed_at = EXCLUDED.completed_at,
      updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_student_competition_entry(
  p_center_id uuid,
  p_student_id uuid,
  p_competition_id uuid,
  p_result_rank text DEFAULT NULL,
  p_rank_position int DEFAULT NULL,
  p_score numeric DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_id uuid;
  v_enrollment_id uuid;
  v_id uuid;
BEGIN
  IF NOT public.has_center_access(p_center_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT fc.brand_id INTO v_brand_id FROM public.franchise_centers fc
  WHERE fc.id = p_center_id AND fc.deleted_at IS NULL;
  IF v_brand_id IS NULL THEN RAISE EXCEPTION 'Center not found'; END IF;

  SELECT e.id INTO v_enrollment_id
  FROM public.student_enrollments e
  WHERE e.student_id = p_student_id AND e.center_id = p_center_id AND e.status = 'active'
  ORDER BY e.enrolled_at DESC LIMIT 1;

  INSERT INTO public.student_competition_entries (
    brand_id, center_id, student_id, enrollment_id, competition_id, result_rank, rank_position, score
  )
  VALUES (
    v_brand_id, p_center_id, p_student_id, v_enrollment_id, p_competition_id,
    nullif(trim(coalesce(p_result_rank, '')), ''), p_rank_position, p_score
  )
  ON CONFLICT (student_id, competition_id) DO UPDATE
  SET result_rank = EXCLUDED.result_rank,
      rank_position = EXCLUDED.rank_position,
      score = EXCLUDED.score,
      enrollment_id = coalesce(EXCLUDED.enrollment_id, student_competition_entries.enrollment_id),
      updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_student_assessment(
  p_center_id uuid,
  p_student_id uuid,
  p_assessment_type text,
  p_score numeric DEFAULT NULL,
  p_max_score numeric DEFAULT NULL,
  p_assessed_at date DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_visible_to_student boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_id uuid;
  v_enrollment_id uuid;
  v_id uuid;
BEGIN
  IF NOT public.has_center_access(p_center_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT fc.brand_id INTO v_brand_id FROM public.franchise_centers fc
  WHERE fc.id = p_center_id AND fc.deleted_at IS NULL;
  IF v_brand_id IS NULL THEN RAISE EXCEPTION 'Center not found'; END IF;

  SELECT e.id INTO v_enrollment_id
  FROM public.student_enrollments e
  WHERE e.student_id = p_student_id AND e.center_id = p_center_id AND e.status = 'active'
  ORDER BY e.enrolled_at DESC LIMIT 1;

  INSERT INTO public.student_assessments (
    brand_id, center_id, student_id, enrollment_id, assessment_type, score, max_score,
    assessed_at, notes, visible_to_student
  )
  VALUES (
    v_brand_id, p_center_id, p_student_id, v_enrollment_id,
    coalesce(nullif(trim(p_assessment_type), ''), 'level_check'),
    p_score, p_max_score,
    coalesce(p_assessed_at, (now() AT TIME ZONE 'Asia/Kolkata')::date),
    nullif(trim(coalesce(p_notes, '')), ''),
    coalesce(p_visible_to_student, true)
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Drop old upsert_brand_competition overloads and replace with extended version
DROP FUNCTION IF EXISTS public.upsert_brand_competition(uuid, text, date, text, boolean, uuid);

CREATE OR REPLACE FUNCTION public.upsert_brand_competition(
  p_brand_id uuid,
  p_name text,
  p_event_date date DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_is_active boolean DEFAULT true,
  p_id uuid DEFAULT NULL,
  p_fee_type text DEFAULT 'free',
  p_fee_amount numeric DEFAULT NULL,
  p_fee_currency text DEFAULT 'INR',
  p_registration_opens_at timestamptz DEFAULT NULL,
  p_registration_closes_at timestamptz DEFAULT NULL,
  p_registration_mode text DEFAULT 'open',
  p_max_participants int DEFAULT NULL,
  p_eligibility_rules jsonb DEFAULT '{"requires_active_enrollment": true}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT public.has_brand_access(p_brand_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF NOT public.brand_feature_enabled(p_brand_id, 'merchandise') THEN
    RAISE EXCEPTION 'feature_disabled';
  END IF;
  IF trim(coalesce(p_name, '')) = '' THEN
    RAISE EXCEPTION 'name is required';
  END IF;
  IF coalesce(p_fee_type, 'free') NOT IN ('free', 'paid') THEN
    RAISE EXCEPTION 'Invalid fee_type';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.brand_competitions (
      brand_id, name, event_date, location, is_active, fee_type, fee_amount, fee_currency,
      registration_opens_at, registration_closes_at, registration_mode, max_participants, eligibility_rules
    )
    VALUES (
      p_brand_id, trim(p_name), p_event_date, nullif(trim(coalesce(p_location, '')), ''),
      coalesce(p_is_active, true), coalesce(p_fee_type, 'free'), p_fee_amount,
      coalesce(p_fee_currency, 'INR'), p_registration_opens_at, p_registration_closes_at,
      coalesce(p_registration_mode, 'open'), p_max_participants,
      coalesce(p_eligibility_rules, '{"requires_active_enrollment": true}'::jsonb)
    )
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.brand_competitions
    SET name = trim(p_name),
        event_date = p_event_date,
        location = nullif(trim(coalesce(p_location, '')), ''),
        is_active = coalesce(p_is_active, true),
        fee_type = coalesce(p_fee_type, fee_type),
        fee_amount = p_fee_amount,
        fee_currency = coalesce(p_fee_currency, fee_currency),
        registration_opens_at = p_registration_opens_at,
        registration_closes_at = p_registration_closes_at,
        registration_mode = coalesce(p_registration_mode, registration_mode),
        max_participants = p_max_participants,
        eligibility_rules = coalesce(p_eligibility_rules, eligibility_rules),
        updated_at = now()
    WHERE id = p_id AND brand_id = p_brand_id
    RETURNING id INTO v_id;
    IF v_id IS NULL THEN RAISE EXCEPTION 'Competition not found'; END IF;
  END IF;
  RETURN v_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Competition registration RPCs
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.register_student_for_competition(p_competition_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id uuid;
  v_brand_id uuid;
  v_enrollment public.student_enrollments%ROWTYPE;
  v_comp public.brand_competitions%ROWTYPE;
  v_count int;
  v_status text;
  v_id uuid;
  v_now timestamptz := now();
BEGIN
  SELECT bc.* INTO v_comp FROM public.brand_competitions bc WHERE bc.id = p_competition_id;
  IF v_comp.id IS NULL OR NOT v_comp.is_active THEN
    RAISE EXCEPTION 'Competition not found';
  END IF;

  v_brand_id := v_comp.brand_id;
  v_student_id := public.resolve_student_for_learn(v_brand_id);
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'NO_STUDENT_LINK';
  END IF;

  v_enrollment := public.get_student_active_enrollment(v_student_id, v_brand_id);

  IF v_comp.fee_type = 'paid' THEN
    RAISE EXCEPTION 'PAID_ENROLLMENT_NOT_AVAILABLE';
  END IF;
  IF v_comp.registration_mode <> 'open' THEN
    RAISE EXCEPTION 'REGISTRATION_CLOSED';
  END IF;
  IF v_comp.registration_opens_at IS NOT NULL AND v_now < v_comp.registration_opens_at THEN
    RAISE EXCEPTION 'REGISTRATION_CLOSED';
  END IF;
  IF v_comp.registration_closes_at IS NOT NULL AND v_now > v_comp.registration_closes_at THEN
    RAISE EXCEPTION 'REGISTRATION_CLOSED';
  END IF;

  IF v_comp.max_participants IS NOT NULL THEN
    SELECT count(*)::int INTO v_count
    FROM public.student_competition_registrations r
    WHERE r.competition_id = p_competition_id AND r.status IN ('registered', 'confirmed', 'waitlisted');
    IF v_count >= v_comp.max_participants THEN
      v_status := 'waitlisted';
    ELSE
      v_status := 'registered';
    END IF;
  ELSE
    v_status := 'registered';
  END IF;

  INSERT INTO public.student_competition_registrations (
    brand_id, center_id, student_id, enrollment_id, competition_id, status, registered_by
  )
  VALUES (
    v_brand_id, v_enrollment.center_id, v_student_id, v_enrollment.id, p_competition_id,
    v_status, auth.uid()
  )
  ON CONFLICT (student_id, competition_id) DO UPDATE
  SET status = CASE
        WHEN student_competition_registrations.status = 'withdrawn' THEN EXCLUDED.status
        ELSE student_competition_registrations.status
      END,
      enrollment_id = EXCLUDED.enrollment_id,
      center_id = EXCLUDED.center_id,
      updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.withdraw_competition_registration(p_registration_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reg public.student_competition_registrations%ROWTYPE;
BEGIN
  SELECT * INTO v_reg FROM public.student_competition_registrations WHERE id = p_registration_id;
  IF v_reg.id IS NULL THEN
    RAISE EXCEPTION 'Registration not found';
  END IF;
  IF NOT public.is_student_self(v_reg.student_id, v_reg.brand_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.student_competition_registrations
  SET status = 'withdrawn', updated_at = now()
  WHERE id = p_registration_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Student learn home RPC (comprehensive dashboard)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_student_learn_home(p_brand_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id uuid;
  v_enrollment public.student_enrollments%ROWTYPE;
  v_result jsonb;
  v_curriculum_version_id uuid;
  v_levels_total int := 0;
  v_levels_completed int := 0;
  v_current_level_id uuid;
  v_completion_pct numeric := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_student_id := public.resolve_student_for_learn(p_brand_id);
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'NO_STUDENT_LINK';
  END IF;

  v_enrollment := public.get_student_active_enrollment(v_student_id, p_brand_id);
  v_curriculum_version_id := v_enrollment.curriculum_version_id;

  IF v_curriculum_version_id IS NOT NULL THEN
    SELECT count(*)::int INTO v_levels_total
    FROM public.levels l WHERE l.curriculum_version_id = v_curriculum_version_id;

    SELECT count(*)::int INTO v_levels_completed
    FROM public.student_level_progress slp
    WHERE slp.student_id = v_student_id AND slp.status = 'completed'
      AND (slp.level_id IN (SELECT id FROM public.levels WHERE curriculum_version_id = v_curriculum_version_id)
           OR slp.enrollment_id = v_enrollment.id);

    SELECT l.id INTO v_current_level_id
    FROM public.levels l
    LEFT JOIN public.student_level_progress slp ON slp.student_id = v_student_id
      AND (slp.level_id = l.id OR slp.level_name = l.name)
    WHERE l.curriculum_version_id = v_curriculum_version_id
      AND coalesce(slp.status, 'not_started') <> 'completed'
    ORDER BY l.sort_order ASC
    LIMIT 1;

    IF v_levels_total > 0 THEN
      v_completion_pct := round((v_levels_completed::numeric / v_levels_total::numeric) * 100, 1);
    END IF;
  END IF;

  SELECT jsonb_build_object(
    'student', (
      SELECT jsonb_build_object(
        'id', s.id,
        'full_name', s.full_name,
        'student_code', s.student_code,
        'date_of_birth', s.date_of_birth,
        'profile', jsonb_build_object(
          'school_name', sp.school_name,
          'city', sp.city,
          'pincode', sp.pincode
        )
      )
      FROM public.students s
      LEFT JOIN public.student_profiles sp ON sp.student_id = s.id
      WHERE s.id = v_student_id
    ),
    'brand', (
      SELECT jsonb_build_object(
        'id', b.id,
        'name', b.name,
        'logo_url', null
      )
      FROM public.brands b WHERE b.id = p_brand_id
    ),
    'enrollment', jsonb_build_object(
      'enrollment_id', v_enrollment.id,
      'status', v_enrollment.status,
      'enrolled_at', v_enrollment.enrolled_at,
      'center_id', v_enrollment.center_id,
      'batch_name', (
        SELECT b.name FROM public.batch_enrollments be
        JOIN public.batches b ON b.id = be.batch_id
        WHERE be.enrollment_id = v_enrollment.id OR (be.student_id = v_student_id AND be.center_id = v_enrollment.center_id)
        ORDER BY be.created_at DESC LIMIT 1
      ),
      'curriculum_version_id', v_curriculum_version_id,
      'curriculum_version_label', (
        SELECT 'v' || cv.version_number::text || ' — ' || p.name
        FROM public.curriculum_versions cv
        JOIN public.programs p ON p.id = cv.program_id
        WHERE cv.id = v_curriculum_version_id
      )
    ),
    'center', (
      SELECT jsonb_build_object(
        'id', fc.id,
        'display_name', coalesce(fc.display_name, fc.name),
        'short_description', fc.short_description,
        'city', fc.city,
        'contact_phone', fc.contact_phone,
        'public_url', coalesce(
          (SELECT 'http://' || dm.hostname || ':9000/'
           FROM public.domain_mappings dm
           WHERE dm.center_id = fc.id AND dm.portal_type = 'center' AND dm.is_primary
           LIMIT 1),
          ''
        )
      )
      FROM public.franchise_centers fc WHERE fc.id = v_enrollment.center_id
    ),
    'curriculum_ladder', jsonb_build_object(
      'current_level_id', v_current_level_id,
      'completion_pct', v_completion_pct,
      'levels', CASE WHEN v_curriculum_version_id IS NULL THEN '[]'::jsonb ELSE COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'level_id', l.id,
            'name', l.name,
            'sort_order', l.sort_order,
            'status', coalesce(slp.status, 'not_started'),
            'completed_at', slp.completed_at,
            'abacus_level_code', l.abacus_level_code
          ) ORDER BY l.sort_order
        )
        FROM public.levels l
        LEFT JOIN public.student_level_progress slp ON slp.student_id = v_student_id
          AND (slp.level_id = l.id OR slp.level_name = l.name)
        WHERE l.curriculum_version_id = v_curriculum_version_id
      ), '[]'::jsonb) END
    ),
    'stats', jsonb_build_object(
      'levels_completed', v_levels_completed,
      'levels_total', v_levels_total,
      'assessments_count', (
        SELECT count(*)::int FROM public.student_assessments a
        WHERE a.student_id = v_student_id AND a.visible_to_student = true
      ),
      'avg_score_pct', (
        SELECT round(avg(a.score / nullif(a.max_score, 0) * 100), 1)
        FROM public.student_assessments a
        WHERE a.student_id = v_student_id AND a.visible_to_student = true
          AND a.score IS NOT NULL AND a.max_score IS NOT NULL AND a.max_score > 0
      ),
      'competitions_registered', (
        SELECT count(*)::int FROM public.student_competition_registrations r
        WHERE r.student_id = v_student_id AND r.status IN ('registered', 'confirmed', 'waitlisted')
      ),
      'competitions_completed', (
        SELECT count(*)::int FROM public.student_competition_entries sce
        WHERE sce.student_id = v_student_id
      )
    ),
    'upcoming_competitions', COALESCE((
      SELECT jsonb_agg(comp ORDER BY comp->>'event_date' ASC NULLS LAST)
      FROM (
        SELECT jsonb_build_object(
          'id', bc.id,
          'name', bc.name,
          'event_date', bc.event_date,
          'location', bc.location,
          'registration_opens_at', bc.registration_opens_at,
          'registration_closes_at', bc.registration_closes_at,
          'fee_type', bc.fee_type,
          'fee_amount', bc.fee_amount,
          'fee_currency', bc.fee_currency,
          'registration_status', CASE
            WHEN bc.registration_mode = 'closed' THEN 'closed'
            WHEN bc.registration_opens_at IS NOT NULL AND now() < bc.registration_opens_at THEN 'upcoming'
            WHEN bc.registration_closes_at IS NOT NULL AND now() > bc.registration_closes_at THEN 'closed'
            ELSE 'open'
          END,
          'my_registration_status', coalesce((
            SELECT r.status FROM public.student_competition_registrations r
            WHERE r.competition_id = bc.id AND r.student_id = v_student_id
          ), 'none'),
          'can_enroll', (
            bc.fee_type = 'free'
            AND bc.registration_mode = 'open'
            AND (bc.registration_opens_at IS NULL OR now() >= bc.registration_opens_at)
            AND (bc.registration_closes_at IS NULL OR now() <= bc.registration_closes_at)
            AND coalesce((
              SELECT r.status FROM public.student_competition_registrations r
              WHERE r.competition_id = bc.id AND r.student_id = v_student_id
            ), 'none') NOT IN ('registered', 'confirmed', 'waitlisted')
          ),
          'enroll_blocked_reason', CASE
            WHEN bc.fee_type = 'paid' THEN 'paid_coming_soon'
            WHEN bc.registration_mode <> 'open' THEN 'registration_closed'
            WHEN bc.registration_closes_at IS NOT NULL AND now() > bc.registration_closes_at THEN 'registration_closed'
            ELSE null
          END
        ) AS comp
        FROM public.brand_competitions bc
        WHERE bc.brand_id = p_brand_id AND bc.is_active = true
          AND (bc.event_date IS NULL OR bc.event_date >= (now() AT TIME ZONE 'Asia/Kolkata')::date)
      ) sub
    ), '[]'::jsonb),
    'my_registrations', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'registration_id', r.id,
          'competition_id', bc.id,
          'name', bc.name,
          'event_date', bc.event_date,
          'status', r.status,
          'fee_type', bc.fee_type
        ) ORDER BY bc.event_date ASC NULLS LAST
      )
      FROM public.student_competition_registrations r
      JOIN public.brand_competitions bc ON bc.id = r.competition_id
      WHERE r.student_id = v_student_id AND r.status IN ('registered', 'confirmed', 'waitlisted')
    ), '[]'::jsonb),
    'recent_results', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'competition_name', bc.name,
          'event_date', bc.event_date,
          'result_rank', sce.result_rank,
          'rank_position', sce.rank_position,
          'score', sce.score
        ) ORDER BY bc.event_date DESC NULLS LAST
      )
      FROM public.student_competition_entries sce
      JOIN public.brand_competitions bc ON bc.id = sce.competition_id
      WHERE sce.student_id = v_student_id
      LIMIT 3
    ), '[]'::jsonb),
    'recent_assessments', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', a.id,
          'assessment_type', a.assessment_type,
          'score', a.score,
          'max_score', a.max_score,
          'assessed_at', a.assessed_at,
          'level_name', null
        ) ORDER BY a.assessed_at DESC
      )
      FROM (
        SELECT * FROM public.student_assessments
        WHERE student_id = v_student_id AND visible_to_student = true
        ORDER BY assessed_at DESC LIMIT 5
      ) a
    ), '[]'::jsonb),
    'recent_activity', COALESCE((
      SELECT jsonb_agg(row.ev ORDER BY (row.ev->>'occurred_at') DESC)
      FROM (
        SELECT ev FROM (
          SELECT jsonb_build_object(
            'type', 'level_progress',
            'title', 'Level ' || slp.level_name,
            'subtitle', slp.status,
            'occurred_at', coalesce(slp.completed_at, slp.updated_at),
            'href', '/progress'
          ) AS ev,
          coalesce(slp.completed_at, slp.updated_at) AS sort_at
          FROM public.student_level_progress slp
          WHERE slp.student_id = v_student_id
          UNION ALL
          SELECT jsonb_build_object(
            'type', 'assessment',
            'title', a.assessment_type,
            'subtitle', coalesce(a.score::text, '') || coalesce('/' || a.max_score::text, ''),
            'occurred_at', a.assessed_at::timestamptz,
            'href', '/progress'
          ),
          a.assessed_at::timestamptz
          FROM public.student_assessments a
          WHERE a.student_id = v_student_id AND a.visible_to_student = true
          UNION ALL
          SELECT jsonb_build_object(
            'type', 'competition_registration',
            'title', bc.name,
            'subtitle', r.status,
            'occurred_at', r.registered_at,
            'href', '/competitions'
          ),
          r.registered_at
          FROM public.student_competition_registrations r
          JOIN public.brand_competitions bc ON bc.id = r.competition_id
          WHERE r.student_id = v_student_id
          UNION ALL
          SELECT jsonb_build_object(
            'type', 'competition_result',
            'title', bc.name,
            'subtitle', coalesce(sce.result_rank, 'Result posted'),
            'occurred_at', coalesce(bc.event_date::timestamptz, sce.updated_at),
            'href', '/competitions'
          ),
          coalesce(bc.event_date::timestamptz, sce.updated_at)
          FROM public.student_competition_entries sce
          JOIN public.brand_competitions bc ON bc.id = sce.competition_id
          WHERE sce.student_id = v_student_id
        ) combined
        ORDER BY sort_at DESC
        LIMIT 10
      ) row
    ), '[]'::jsonb),
    'quick_actions', jsonb_build_array(
      jsonb_build_object('label', 'View full progress', 'href', '/progress'),
      jsonb_build_object('label', 'All competitions', 'href', '/competitions'),
      jsonb_build_object('label', 'Activity timeline', 'href', '/activity'),
      jsonb_build_object('label', 'My profile', 'href', '/profile')
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_student_progress_detail(p_brand_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id uuid;
  v_home jsonb;
BEGIN
  v_home := public.get_student_learn_home(p_brand_id);
  v_student_id := (v_home->'student'->>'id')::uuid;

  RETURN jsonb_build_object(
    'curriculum_ladder', v_home->'curriculum_ladder',
    'assessments', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', a.id,
          'assessment_type', a.assessment_type,
          'score', a.score,
          'max_score', a.max_score,
          'assessed_at', a.assessed_at,
          'notes', a.notes
        ) ORDER BY a.assessed_at DESC
      )
      FROM public.student_assessments a
      WHERE a.student_id = v_student_id AND a.visible_to_student = true
    ), '[]'::jsonb),
    'level_progress', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'level_name', slp.level_name,
          'status', slp.status,
          'completed_at', slp.completed_at,
          'level_id', slp.level_id
        ) ORDER BY slp.updated_at DESC
      )
      FROM public.student_level_progress slp
      WHERE slp.student_id = v_student_id AND slp.brand_id = p_brand_id
    ), '[]'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_student_competitions(p_brand_id uuid, p_filter text DEFAULT 'upcoming')
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id uuid;
  v_home jsonb;
BEGIN
  v_student_id := public.resolve_student_for_learn(p_brand_id);
  IF v_student_id IS NULL THEN RAISE EXCEPTION 'NO_STUDENT_LINK'; END IF;
  PERFORM public.get_student_active_enrollment(v_student_id, p_brand_id);

  IF p_filter = 'registered' THEN
    RETURN COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'registration_id', r.id,
          'competition_id', bc.id,
          'name', bc.name,
          'event_date', bc.event_date,
          'location', bc.location,
          'status', r.status,
          'fee_type', bc.fee_type,
          'fee_amount', bc.fee_amount
        ) ORDER BY bc.event_date ASC NULLS LAST
      )
      FROM public.student_competition_registrations r
      JOIN public.brand_competitions bc ON bc.id = r.competition_id
      WHERE r.student_id = v_student_id AND r.status IN ('registered', 'confirmed', 'waitlisted')
    ), '[]'::jsonb);
  ELSIF p_filter = 'past' THEN
    RETURN COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'competition_id', bc.id,
          'name', bc.name,
          'event_date', bc.event_date,
          'result_rank', sce.result_rank,
          'rank_position', sce.rank_position,
          'score', sce.score
        ) ORDER BY bc.event_date DESC NULLS LAST
      )
      FROM public.student_competition_entries sce
      JOIN public.brand_competitions bc ON bc.id = sce.competition_id
      WHERE sce.student_id = v_student_id
    ), '[]'::jsonb);
  ELSE
    v_home := public.get_student_learn_home(p_brand_id);
    RETURN v_home->'upcoming_competitions';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_student_profile(p_brand_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_home jsonb;
BEGIN
  v_home := public.get_student_learn_home(p_brand_id);
  RETURN jsonb_build_object(
    'student', v_home->'student',
    'enrollment', v_home->'enrollment',
    'center', v_home->'center',
    'brand', v_home->'brand',
    'enrollment_history', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'enrollment_id', e.id,
          'status', e.status,
          'enrolled_at', e.enrolled_at,
          'center_name', coalesce(fc.display_name, fc.name)
        ) ORDER BY e.enrolled_at DESC
      )
      FROM public.student_enrollments e
      JOIN public.franchise_centers fc ON fc.id = e.center_id
      WHERE e.student_id = (v_home->'student'->>'id')::uuid AND e.brand_id = p_brand_id
    ), '[]'::jsonb)
  );
END;
$$;

-- Grants
REVOKE ALL ON FUNCTION public.register_student_for_competition(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_student_for_competition(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.withdraw_competition_registration(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.withdraw_competition_registration(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.get_student_learn_home(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_student_learn_home(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.get_student_progress_detail(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_student_progress_detail(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.get_student_competitions(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_student_competitions(uuid, text) TO authenticated;
REVOKE ALL ON FUNCTION public.get_student_profile(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_student_profile(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.upsert_brand_competition(uuid, text, date, text, boolean, uuid, text, numeric, text, timestamptz, timestamptz, text, int, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_brand_competition(uuid, text, date, text, boolean, uuid, text, numeric, text, timestamptz, timestamptz, text, int, jsonb) TO authenticated;
REVOKE ALL ON FUNCTION public.record_student_level_progress(uuid, uuid, text, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_student_level_progress(uuid, uuid, text, text, uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.record_student_competition_entry(uuid, uuid, uuid, text, int, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_student_competition_entry(uuid, uuid, uuid, text, int, numeric) TO authenticated;
REVOKE ALL ON FUNCTION public.record_student_assessment(uuid, uuid, text, numeric, numeric, date, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_student_assessment(uuid, uuid, text, numeric, numeric, date, text, boolean) TO authenticated;
