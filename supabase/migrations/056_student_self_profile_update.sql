-- Student learn portal: self-service profile edits (demographics + contact/address)

CREATE OR REPLACE FUNCTION public.update_student_self_profile(
  p_brand_id uuid,
  p_full_name text,
  p_date_of_birth date DEFAULT NULL,
  p_school_name text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_pincode text DEFAULT NULL,
  p_address_line1 text DEFAULT NULL,
  p_state text DEFAULT NULL,
  p_phone text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id uuid;
  v_name text;
  v_phone text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_student_id := public.resolve_student_for_learn(p_brand_id);
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'NO_STUDENT_LINK';
  END IF;

  v_name := trim(coalesce(p_full_name, ''));
  IF length(v_name) < 2 THEN
    RAISE EXCEPTION 'INVALID_NAME';
  END IF;

  v_phone := public.normalize_phone_e164(nullif(trim(coalesce(p_phone, '')), ''));

  UPDATE public.students
  SET
    full_name = v_name,
    date_of_birth = p_date_of_birth,
    updated_at = now()
  WHERE id = v_student_id
    AND brand_id = p_brand_id
    AND deleted_at IS NULL;

  INSERT INTO public.student_profiles (
    brand_id,
    student_id,
    school_name,
    city,
    pincode,
    address_line1,
    state,
    phone
  )
  VALUES (
    p_brand_id,
    v_student_id,
    nullif(trim(coalesce(p_school_name, '')), ''),
    nullif(trim(coalesce(p_city, '')), ''),
    nullif(trim(coalesce(p_pincode, '')), ''),
    nullif(trim(coalesce(p_address_line1, '')), ''),
    nullif(trim(coalesce(p_state, '')), ''),
    v_phone
  )
  ON CONFLICT (student_id) DO UPDATE SET
    school_name = EXCLUDED.school_name,
    city = EXCLUDED.city,
    pincode = EXCLUDED.pincode,
    address_line1 = EXCLUDED.address_line1,
    state = EXCLUDED.state,
    phone = EXCLUDED.phone,
    updated_at = now();

  RETURN public.get_student_profile(p_brand_id)->'student';
END;
$$;

REVOKE ALL ON FUNCTION public.update_student_self_profile(uuid, text, date, text, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_student_self_profile(uuid, text, date, text, text, text, text, text, text) TO authenticated;

-- Enrich profile payload with delivery/contact fields for the learn portal.
CREATE OR REPLACE FUNCTION public.get_student_profile(p_brand_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_home jsonb;
  v_student_id uuid;
  v_profile jsonb;
BEGIN
  v_home := public.get_student_learn_home(p_brand_id);
  v_student_id := (v_home->'student'->>'id')::uuid;

  SELECT jsonb_build_object(
    'school_name', sp.school_name,
    'city', sp.city,
    'pincode', sp.pincode,
    'address_line1', sp.address_line1,
    'state', sp.state,
    'phone', sp.phone
  )
  INTO v_profile
  FROM public.student_profiles sp
  WHERE sp.student_id = v_student_id;

  v_home := jsonb_set(
    v_home,
    '{student,profile}',
    coalesce(v_profile, '{}'::jsonb)
  );

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
      WHERE e.student_id = v_student_id AND e.brand_id = p_brand_id
    ), '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_student_profile(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_student_profile(uuid) TO authenticated;
