-- Harden convert_lead_to_student: empty child_dob override ("") must not cast to date.
-- UI quick-confirm sends childDob: "" when the lead has no DOB; ''::date raises 400.

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
  v_child_dob date;
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

  v_child_dob := coalesce(
    nullif(trim(p_overrides ->> 'child_dob'), '')::date,
    v_lead.child_dob
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
    v_child_dob,
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

REVOKE ALL ON FUNCTION public.convert_lead_to_student(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.convert_lead_to_student(uuid, jsonb) TO authenticated;

NOTIFY pgrst, 'reload schema';
