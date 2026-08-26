-- Learn shell header reads photo from get_student_learn_home → student.profile.photo_url.
-- Profile page uses get_student_profile which already includes photo_url; home payload did not.

CREATE OR REPLACE FUNCTION public.get_student_learn_home(p_brand_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_student_id uuid;
  v_profile jsonb;
BEGIN
  IF to_regprocedure('public._get_student_learn_home_base(uuid)') IS NOT NULL THEN
    v_result := public._get_student_learn_home_base(p_brand_id);
  ELSE
    RAISE EXCEPTION 'Missing _get_student_learn_home_base';
  END IF;

  IF NOT public.brand_feature_enabled(p_brand_id, 'competitions') THEN
    v_result := v_result || jsonb_build_object(
      'upcoming_competitions', '[]'::jsonb,
      'my_registrations', '[]'::jsonb,
      'recent_results', '[]'::jsonb
    );
    v_result := jsonb_set(v_result, '{stats,competitions_registered}', '0'::jsonb);
    v_result := jsonb_set(v_result, '{stats,competitions_completed}', '0'::jsonb);
    v_result := jsonb_set(
      v_result,
      '{quick_actions}',
      COALESCE((
        SELECT jsonb_agg(elem)
        FROM jsonb_array_elements(COALESCE(v_result->'quick_actions', '[]'::jsonb)) elem
        WHERE elem->>'href' IS DISTINCT FROM '/competitions'
      ), '[]'::jsonb)
    );
    v_result := jsonb_set(
      v_result,
      '{recent_activity}',
      COALESCE((
        SELECT jsonb_agg(elem)
        FROM jsonb_array_elements(COALESCE(v_result->'recent_activity', '[]'::jsonb)) elem
        WHERE elem->>'type' NOT IN ('competition_registration', 'competition_result')
      ), '[]'::jsonb)
    );
  END IF;

  v_student_id := (v_result #>> '{student,id}')::uuid;
  IF v_student_id IS NOT NULL THEN
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

    v_result := jsonb_set(
      v_result,
      '{student,profile}',
      coalesce(v_profile, coalesce(v_result->'student'->'profile', '{}'::jsonb))
    );
  END IF;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_student_learn_home(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_student_learn_home(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
