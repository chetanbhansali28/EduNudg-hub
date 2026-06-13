-- Student profile photo in brand-assets + self-upload storage policy + required profile fields

ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS photo_url text;

COMMENT ON COLUMN public.student_profiles.photo_url IS
  'Public URL in brand-assets at {brand_id}/students/{student_id}/photo.{ext}. Re-upload replaces prior photo.';

-- Students may manage their own photo folder under brand-assets.
CREATE POLICY brand_assets_student_self ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'brand-assets'
    AND coalesce(array_length(storage.foldername(name), 1), 0) >= 3
    AND (storage.foldername(name))[2] = 'students'
    AND (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND (storage.foldername(name))[3] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND public.is_student_self((storage.foldername(name))[3]::uuid, (storage.foldername(name))[1]::uuid)
  )
  WITH CHECK (
    bucket_id = 'brand-assets'
    AND coalesce(array_length(storage.foldername(name), 1), 0) >= 3
    AND (storage.foldername(name))[2] = 'students'
    AND (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND (storage.foldername(name))[3] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND public.is_student_self((storage.foldername(name))[3]::uuid, (storage.foldername(name))[1]::uuid)
  );

DROP FUNCTION IF EXISTS public.update_student_self_profile(uuid, text, date, text, text, text, text, text, text);

CREATE OR REPLACE FUNCTION public.update_student_self_profile(
  p_brand_id uuid,
  p_full_name text,
  p_date_of_birth date,
  p_phone text,
  p_pincode text,
  p_photo_url text,
  p_school_name text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_address_line1 text DEFAULT NULL,
  p_state text DEFAULT NULL
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
  v_pincode text;
  v_photo text;
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

  IF p_date_of_birth IS NULL THEN
    RAISE EXCEPTION 'MISSING_DATE_OF_BIRTH';
  END IF;

  v_phone := public.normalize_phone_e164(nullif(trim(coalesce(p_phone, '')), ''));
  IF v_phone IS NULL THEN
    RAISE EXCEPTION 'MISSING_PHONE';
  END IF;

  v_pincode := trim(coalesce(p_pincode, ''));
  IF v_pincode = '' THEN
    RAISE EXCEPTION 'MISSING_PINCODE';
  END IF;

  v_photo := trim(coalesce(p_photo_url, ''));
  IF v_photo = '' THEN
    RAISE EXCEPTION 'MISSING_PHOTO';
  END IF;

  IF position(v_student_id::text IN v_photo) = 0 THEN
    RAISE EXCEPTION 'INVALID_PHOTO';
  END IF;

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
    phone,
    photo_url
  )
  VALUES (
    p_brand_id,
    v_student_id,
    nullif(trim(coalesce(p_school_name, '')), ''),
    nullif(trim(coalesce(p_city, '')), ''),
    v_pincode,
    nullif(trim(coalesce(p_address_line1, '')), ''),
    nullif(trim(coalesce(p_state, '')), ''),
    v_phone,
    v_photo
  )
  ON CONFLICT (student_id) DO UPDATE SET
    school_name = EXCLUDED.school_name,
    city = EXCLUDED.city,
    pincode = EXCLUDED.pincode,
    address_line1 = EXCLUDED.address_line1,
    state = EXCLUDED.state,
    phone = EXCLUDED.phone,
    photo_url = EXCLUDED.photo_url,
    updated_at = now();

  RETURN public.get_student_profile(p_brand_id)->'student';
END;
$$;

REVOKE ALL ON FUNCTION public.update_student_self_profile(uuid, text, date, text, text, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_student_self_profile(uuid, text, date, text, text, text, text, text, text, text) TO authenticated;

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
    'phone', sp.phone,
    'photo_url', sp.photo_url
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
