-- Align center Add student lead with student CSV template fields.
-- Persist extras on leads; copy onto student/profile/portal on convert.
-- Idempotent: safe to re-run if a prior SQL-editor pass already created the 15-arg RPCs.

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS login_email text,
  ADD COLUMN IF NOT EXISTS address_line1 text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS program_name text,
  ADD COLUMN IF NOT EXISTS starting_level text;

COMMENT ON COLUMN public.leads.login_email IS 'Optional student portal email collected on Add lead / import-aligned form.';
COMMENT ON COLUMN public.leads.address_line1 IS 'Optional street address; copied to student_profiles on convert.';
COMMENT ON COLUMN public.leads.state IS 'Optional state; copied to student_profiles on convert.';
COMMENT ON COLUMN public.leads.program_name IS 'Optional course name; pinned on convert when assigned to the center.';
COMMENT ON COLUMN public.leads.starting_level IS 'Optional level name within program_name.';

CREATE OR REPLACE FUNCTION public.upsert_lead_by_whatsapp(
  p_brand_id uuid,
  p_whatsapp text,
  p_payload jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wa text;
  v_id uuid;
  v_existing public.leads%ROWTYPE;
  v_lead_source text;
  v_center_id uuid;
  v_event_type text;
  v_prev_lost_reason text;
BEGIN
  v_wa := public.normalize_phone_e164(p_whatsapp);
  IF v_wa IS NULL THEN
    RAISE EXCEPTION 'whatsapp_e164 is required';
  END IF;

  v_lead_source := coalesce(p_payload ->> 'lead_source', 'brand');
  v_center_id := (p_payload ->> 'center_id')::uuid;

  SELECT * INTO v_existing
  FROM public.leads l
  WHERE l.brand_id = p_brand_id AND l.whatsapp_e164 = v_wa
  ORDER BY l.created_at DESC
  LIMIT 1;

  IF v_existing.id IS NOT NULL THEN
    IF v_existing.status = 'converted' THEN
      RAISE EXCEPTION 'This student is already enrolled. Contact the center for changes.';
    END IF;

    v_prev_lost_reason := v_existing.lost_reason;
    v_event_type := CASE
      WHEN v_existing.status = 'lost' THEN 'reopened_merge'
      ELSE 'merged'
    END;

    UPDATE public.leads SET
      full_name = coalesce(nullif(trim(p_payload ->> 'parent_name'), ''), full_name),
      parent_name = coalesce(nullif(trim(p_payload ->> 'parent_name'), ''), parent_name),
      email = coalesce(nullif(trim(lower(p_payload ->> 'email')), ''), email),
      phone_e164 = coalesce(v_wa, phone_e164),
      child_name = coalesce(nullif(trim(p_payload ->> 'child_name'), ''), child_name),
      child_dob = coalesce((p_payload ->> 'child_dob')::date, child_dob),
      pincode = coalesce(nullif(trim(p_payload ->> 'pincode'), ''), pincode),
      city = coalesce(nullif(trim(p_payload ->> 'city'), ''), city),
      school_name = coalesce(nullif(trim(p_payload ->> 'school_name'), ''), school_name),
      notes = coalesce(nullif(trim(p_payload ->> 'notes'), ''), notes),
      login_email = coalesce(nullif(trim(lower(p_payload ->> 'login_email')), ''), login_email),
      address_line1 = coalesce(nullif(trim(p_payload ->> 'address_line1'), ''), address_line1),
      state = coalesce(nullif(trim(p_payload ->> 'state'), ''), state),
      program_name = coalesce(nullif(trim(p_payload ->> 'program_name'), ''), program_name),
      starting_level = coalesce(nullif(trim(p_payload ->> 'starting_level'), ''), starting_level),
      center_id = CASE
        WHEN v_lead_source = 'center' AND v_center_id IS NOT NULL THEN v_center_id
        ELSE center_id
      END,
      lead_source = CASE
        WHEN v_lead_source = 'center' THEN 'center'
        ELSE lead_source
      END,
      status = CASE
        WHEN v_existing.status = 'lost' THEN 'new'
        ELSE status
      END,
      lost_reason = CASE
        WHEN v_existing.status = 'lost' THEN NULL
        ELSE lost_reason
      END,
      updated_at = now()
    WHERE id = v_existing.id;

    INSERT INTO public.lead_events (lead_id, brand_id, event_type, payload, created_by)
    VALUES (
      v_existing.id,
      p_brand_id,
      v_event_type,
      p_payload || jsonb_build_object(
        'prior_status', v_existing.status,
        'previous_lost_reason', v_prev_lost_reason
      ),
      auth.uid()
    );

    RETURN v_existing.id;
  END IF;

  INSERT INTO public.leads (
    brand_id, center_id, full_name, parent_name, email, phone_e164, whatsapp_e164,
    child_name, child_dob, pincode, city, school_name, notes,
    login_email, address_line1, state, program_name, starting_level,
    lead_source, source, status
  )
  VALUES (
    p_brand_id,
    CASE WHEN v_lead_source = 'center' THEN v_center_id ELSE NULL END,
    coalesce(nullif(trim(p_payload ->> 'parent_name'), ''), 'Parent'),
    nullif(trim(p_payload ->> 'parent_name'), ''),
    nullif(trim(lower(p_payload ->> 'email')), ''),
    v_wa,
    v_wa,
    nullif(trim(p_payload ->> 'child_name'), ''),
    (p_payload ->> 'child_dob')::date,
    nullif(trim(p_payload ->> 'pincode'), ''),
    nullif(trim(p_payload ->> 'city'), ''),
    nullif(trim(p_payload ->> 'school_name'), ''),
    nullif(trim(p_payload ->> 'notes'), ''),
    nullif(trim(lower(p_payload ->> 'login_email')), ''),
    nullif(trim(p_payload ->> 'address_line1'), ''),
    nullif(trim(p_payload ->> 'state'), ''),
    nullif(trim(p_payload ->> 'program_name'), ''),
    nullif(trim(p_payload ->> 'starting_level'), ''),
    v_lead_source,
    v_lead_source,
    'new'
  )
  RETURNING id INTO v_id;

  INSERT INTO public.lead_events (lead_id, brand_id, event_type, payload, created_by)
  VALUES (v_id, p_brand_id, 'created', p_payload, auth.uid());

  RETURN v_id;
END;
$$;

-- 10-arg signatures from 019; 15-arg signatures from a prior (partial) run of this file.
DROP FUNCTION IF EXISTS public.create_brand_student_lead_staff(uuid, text, text, text, text, text, text, date, text, text);
DROP FUNCTION IF EXISTS public.create_center_student_lead_staff(uuid, text, text, text, text, text, text, date, text, text);
DROP FUNCTION IF EXISTS public.create_brand_student_lead_staff(
  uuid, text, text, text, text, text, text, date, text, text, text, text, text, text, text
);
DROP FUNCTION IF EXISTS public.create_center_student_lead_staff(
  uuid, text, text, text, text, text, text, date, text, text, text, text, text, text, text
);

CREATE OR REPLACE FUNCTION public.create_brand_student_lead_staff(
  p_brand_id uuid,
  p_parent_name text,
  p_whatsapp_e164 text,
  p_email text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_pincode text DEFAULT NULL,
  p_child_name text DEFAULT NULL,
  p_child_dob date DEFAULT NULL,
  p_school_name text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_login_email text DEFAULT NULL,
  p_address_line1 text DEFAULT NULL,
  p_state text DEFAULT NULL,
  p_program_name text DEFAULT NULL,
  p_starting_level text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_payload jsonb;
BEGIN
  IF NOT public.has_brand_access(p_brand_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF trim(coalesce(p_parent_name, '')) = '' OR trim(coalesce(p_whatsapp_e164, '')) = '' THEN
    RAISE EXCEPTION 'parent_name and whatsapp are required';
  END IF;

  v_payload := jsonb_build_object(
    'lead_source', 'brand',
    'parent_name', trim(p_parent_name),
    'email', nullif(trim(lower(coalesce(p_email, ''))), ''),
    'whatsapp_e164', p_whatsapp_e164,
    'city', nullif(trim(coalesce(p_city, '')), ''),
    'pincode', nullif(trim(coalesce(p_pincode, '')), ''),
    'child_name', nullif(trim(coalesce(p_child_name, '')), ''),
    'child_dob', p_child_dob,
    'school_name', nullif(trim(coalesce(p_school_name, '')), ''),
    'notes', coalesce(nullif(trim(coalesce(p_notes, '')), ''), 'Manual entry by brand staff'),
    'login_email', nullif(trim(lower(coalesce(p_login_email, ''))), ''),
    'address_line1', nullif(trim(coalesce(p_address_line1, '')), ''),
    'state', nullif(trim(coalesce(p_state, '')), ''),
    'program_name', nullif(trim(coalesce(p_program_name, '')), ''),
    'starting_level', nullif(trim(coalesce(p_starting_level, '')), '')
  );

  v_id := public.upsert_lead_by_whatsapp(p_brand_id, p_whatsapp_e164, v_payload);

  INSERT INTO public.lead_events (lead_id, brand_id, event_type, payload, created_by)
  VALUES (v_id, p_brand_id, 'manual_created', jsonb_build_object('scope', 'brand'), auth.uid());

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_center_student_lead_staff(
  p_center_id uuid,
  p_parent_name text,
  p_whatsapp_e164 text,
  p_email text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_pincode text DEFAULT NULL,
  p_child_name text DEFAULT NULL,
  p_child_dob date DEFAULT NULL,
  p_school_name text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_login_email text DEFAULT NULL,
  p_address_line1 text DEFAULT NULL,
  p_state text DEFAULT NULL,
  p_program_name text DEFAULT NULL,
  p_starting_level text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_brand_id uuid;
  v_payload jsonb;
BEGIN
  IF NOT public.has_center_access(p_center_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT fc.brand_id INTO v_brand_id
  FROM public.franchise_centers fc
  WHERE fc.id = p_center_id AND fc.deleted_at IS NULL;

  IF v_brand_id IS NULL THEN
    RAISE EXCEPTION 'Center not found';
  END IF;

  IF trim(coalesce(p_parent_name, '')) = '' OR trim(coalesce(p_whatsapp_e164, '')) = '' THEN
    RAISE EXCEPTION 'parent_name and whatsapp are required';
  END IF;

  v_payload := jsonb_build_object(
    'lead_source', 'center',
    'center_id', p_center_id,
    'parent_name', trim(p_parent_name),
    'email', nullif(trim(lower(coalesce(p_email, ''))), ''),
    'whatsapp_e164', p_whatsapp_e164,
    'city', nullif(trim(coalesce(p_city, '')), ''),
    'pincode', nullif(trim(coalesce(p_pincode, '')), ''),
    'child_name', nullif(trim(coalesce(p_child_name, '')), ''),
    'child_dob', p_child_dob,
    'school_name', nullif(trim(coalesce(p_school_name, '')), ''),
    'notes', coalesce(nullif(trim(coalesce(p_notes, '')), ''), 'Manual entry by center staff'),
    'login_email', nullif(trim(lower(coalesce(p_login_email, ''))), ''),
    'address_line1', nullif(trim(coalesce(p_address_line1, '')), ''),
    'state', nullif(trim(coalesce(p_state, '')), ''),
    'program_name', nullif(trim(coalesce(p_program_name, '')), ''),
    'starting_level', nullif(trim(coalesce(p_starting_level, '')), '')
  );

  v_id := public.upsert_lead_by_whatsapp(v_brand_id, p_whatsapp_e164, v_payload);

  INSERT INTO public.lead_events (lead_id, brand_id, event_type, payload, created_by)
  VALUES (v_id, v_brand_id, 'manual_created', jsonb_build_object('scope', 'center', 'center_id', p_center_id), auth.uid());

  RETURN v_id;
END;
$$;

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
  v_enrollment_id uuid;
  v_parent_name text;
  v_child_name text;
  v_school_name text;
  v_city text;
  v_pincode text;
  v_login_email text;
  v_program_id uuid;
  v_level_id uuid;
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
  v_login_email := coalesce(
    nullif(trim(p_overrides ->> 'student_login_email'), ''),
    nullif(trim(v_lead.login_email), ''),
    nullif(trim(v_lead.email), '')
  );

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

  INSERT INTO public.student_profiles (
    brand_id, student_id, school_name, city, pincode, address_line1, state, phone
  )
  VALUES (
    v_lead.brand_id,
    v_student_id,
    v_school_name,
    v_city,
    v_pincode,
    v_lead.address_line1,
    v_lead.state,
    coalesce(v_lead.whatsapp_e164, v_lead.phone_e164)
  );

  INSERT INTO public.student_enrollments (brand_id, center_id, student_id, status)
  VALUES (v_lead.brand_id, v_lead.center_id, v_student_id, 'active')
  RETURNING id INTO v_enrollment_id;

  IF nullif(trim(coalesce(v_lead.program_name, '')), '') IS NOT NULL THEN
    SELECT p.id INTO v_program_id
    FROM public.programs p
    WHERE p.brand_id = v_lead.brand_id
      AND p.deleted_at IS NULL
      AND lower(trim(p.name)) = lower(trim(v_lead.program_name))
      AND public.is_program_authorized_for_center(v_lead.center_id, p.id)
    ORDER BY p.created_at ASC
    LIMIT 1;

    IF v_program_id IS NOT NULL THEN
      IF nullif(trim(coalesce(v_lead.starting_level, '')), '') IS NOT NULL THEN
        SELECT l.id INTO v_level_id
        FROM public.levels l
        WHERE l.program_id = v_program_id
          AND lower(trim(l.name)) = lower(trim(v_lead.starting_level))
        ORDER BY l.sort_order ASC
        LIMIT 1;
      END IF;

      BEGIN
        PERFORM public.pin_enrollment_program(v_enrollment_id, v_program_id, v_level_id);
      EXCEPTION
        WHEN OTHERS THEN
          NULL;
      END;
    END IF;
  END IF;

  UPDATE public.leads SET status = 'converted', updated_at = now() WHERE id = p_lead_id;

  RETURN v_student_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_brand_student_lead_staff(
  uuid, text, text, text, text, text, text, date, text, text, text, text, text, text, text
) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_center_student_lead_staff(
  uuid, text, text, text, text, text, text, date, text, text, text, text, text, text, text
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_brand_student_lead_staff(
  uuid, text, text, text, text, text, text, date, text, text, text, text, text, text, text
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_center_student_lead_staff(
  uuid, text, text, text, text, text, text, date, text, text, text, text, text, text, text
) TO authenticated;

REVOKE ALL ON FUNCTION public.upsert_lead_by_whatsapp(uuid, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_lead_by_whatsapp(uuid, text, jsonb) TO authenticated;
REVOKE ALL ON FUNCTION public.convert_lead_to_student(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.convert_lead_to_student(uuid, jsonb) TO authenticated;

NOTIFY pgrst, 'reload schema';
