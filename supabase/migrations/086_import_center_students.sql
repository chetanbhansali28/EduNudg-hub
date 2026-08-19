-- Center staff CSV import: create enrolled students + profiles (skip leads pipeline)

CREATE OR REPLACE FUNCTION public.import_center_students(
  p_center_id uuid,
  p_rows jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_id uuid;
  v_row jsonb;
  v_row_num int := 0;
  v_row_count int;
  v_student_name text;
  v_parent_name text;
  v_whatsapp text;
  v_whatsapp_norm text;
  v_email text;
  v_login_email text;
  v_student_code text;
  v_code_seq int := 0;
  v_school_name text;
  v_city text;
  v_pincode text;
  v_address text;
  v_state text;
  v_program_name text;
  v_starting_level text;
  v_child_dob date;
  v_program_id uuid;
  v_level_id uuid;
  v_parent_id uuid;
  v_student_id uuid;
  v_enrollment_id uuid;
  v_existing uuid;
  v_created jsonb := '[]'::jsonb;
  v_skipped jsonb := '[]'::jsonb;
  v_errors jsonb := '[]'::jsonb;
BEGIN
  IF p_center_id IS NULL THEN
    RAISE EXCEPTION 'center_id required';
  END IF;

  IF NOT public.has_center_access(p_center_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_rows IS NULL OR jsonb_typeof(p_rows) != 'array' THEN
    RAISE EXCEPTION 'p_rows must be a JSON array';
  END IF;

  v_row_count := jsonb_array_length(p_rows);
  IF v_row_count < 1 THEN
    RAISE EXCEPTION 'At least one row is required';
  END IF;

  IF v_row_count > 500 THEN
    RAISE EXCEPTION 'Too many rows (max 500)';
  END IF;

  SELECT fc.brand_id INTO v_brand_id
  FROM public.franchise_centers fc
  WHERE fc.id = p_center_id AND fc.deleted_at IS NULL;

  IF v_brand_id IS NULL THEN
    RAISE EXCEPTION 'Center not found';
  END IF;

  SELECT coalesce(max(
    CASE
      WHEN s.student_code ~ '^STU-[0-9]+$' THEN substring(s.student_code from 5)::int
      ELSE 0
    END
  ), 0) INTO v_code_seq
  FROM public.students s
  WHERE s.brand_id = v_brand_id;

  FOR v_row IN SELECT value FROM jsonb_array_elements(p_rows) LOOP
    v_row_num := v_row_num + 1;
    v_program_id := NULL;
    v_level_id := NULL;
    v_parent_id := NULL;
    v_student_id := NULL;
    v_enrollment_id := NULL;
    v_existing := NULL;
    v_child_dob := NULL;

    v_student_name := public.import_franchise_center_text(
      coalesce(v_row->>'student_name', v_row->>'child_name'),
      200
    );
    v_parent_name := public.import_franchise_center_text(v_row->>'parent_name', 200);
    v_whatsapp := public.import_franchise_center_text(
      coalesce(nullif(trim(coalesce(v_row->>'whatsapp', '')), ''), v_row->>'phone'),
      32
    );
    v_email := lower(trim(coalesce(public.import_franchise_center_text(v_row->>'email', 320), '')));
    v_login_email := lower(trim(coalesce(public.import_franchise_center_text(v_row->>'login_email', 320), '')));
    v_student_code := NULL;
    v_school_name := public.import_franchise_center_text(v_row->>'school_name', 200);
    v_city := public.import_franchise_center_text(v_row->>'city', 100);
    v_pincode := public.import_franchise_center_text(v_row->>'pincode', 12);
    v_address := public.import_franchise_center_text(v_row->>'address_line1', 500);
    v_state := public.import_franchise_center_text(v_row->>'state', 100);
    v_program_name := public.import_franchise_center_text(v_row->>'program_name', 200);
    v_starting_level := public.import_franchise_center_text(v_row->>'starting_level', 120);

    IF v_student_name IS NULL OR v_student_name = '' THEN
      v_errors := v_errors || jsonb_build_array(
        jsonb_build_object('row', v_row_num, 'message', 'student_name is required')
      );
      CONTINUE;
    END IF;

    IF v_parent_name IS NULL OR v_parent_name = '' THEN
      v_errors := v_errors || jsonb_build_array(
        jsonb_build_object('row', v_row_num, 'message', 'parent_name is required')
      );
      CONTINUE;
    END IF;

    IF v_whatsapp IS NULL OR v_whatsapp = '' THEN
      v_errors := v_errors || jsonb_build_array(
        jsonb_build_object('row', v_row_num, 'message', 'whatsapp is required')
      );
      CONTINUE;
    END IF;

    BEGIN
      v_whatsapp_norm := public.normalize_phone_e164(v_whatsapp);
    EXCEPTION
      WHEN OTHERS THEN
        v_whatsapp_norm := NULL;
    END;

    IF v_whatsapp_norm IS NULL THEN
      v_errors := v_errors || jsonb_build_array(
        jsonb_build_object('row', v_row_num, 'message', 'Invalid WhatsApp number')
      );
      CONTINUE;
    END IF;

    IF v_email <> '' AND NOT public.is_import_email(v_email) THEN
      v_errors := v_errors || jsonb_build_array(
        jsonb_build_object('row', v_row_num, 'message', 'Invalid email')
      );
      CONTINUE;
    END IF;

    IF v_login_email <> '' AND NOT public.is_import_email(v_login_email) THEN
      v_errors := v_errors || jsonb_build_array(
        jsonb_build_object('row', v_row_num, 'message', 'Invalid login_email')
      );
      CONTINUE;
    END IF;

    IF v_pincode IS NOT NULL AND v_pincode <> '' AND v_pincode !~ '^\d{6}$' THEN
      v_errors := v_errors || jsonb_build_array(
        jsonb_build_object('row', v_row_num, 'message', 'pincode must be a 6-digit India pincode')
      );
      CONTINUE;
    END IF;

    IF nullif(trim(coalesce(v_row->>'student_dob', v_row->>'child_dob', '')), '') IS NOT NULL THEN
      BEGIN
        v_child_dob := coalesce(v_row->>'student_dob', v_row->>'child_dob')::date;
      EXCEPTION
        WHEN OTHERS THEN
          v_errors := v_errors || jsonb_build_array(
            jsonb_build_object('row', v_row_num, 'message', 'Invalid student_dob (use YYYY-MM-DD)')
          );
          CONTINUE;
      END;
    END IF;

    IF v_program_name IS NOT NULL THEN
      SELECT p.id INTO v_program_id
      FROM public.programs p
      WHERE p.brand_id = v_brand_id
        AND p.deleted_at IS NULL
        AND lower(trim(p.name)) = lower(v_program_name)
        AND public.is_program_authorized_for_center(p_center_id, p.id)
      ORDER BY p.created_at ASC
      LIMIT 1;

      IF v_program_id IS NULL THEN
        v_errors := v_errors || jsonb_build_array(
          jsonb_build_object(
            'row', v_row_num,
            'message', 'program_name not found or not assigned to this center'
          )
        );
        CONTINUE;
      END IF;

      IF v_starting_level IS NOT NULL THEN
        SELECT l.id INTO v_level_id
        FROM public.levels l
        WHERE l.program_id = v_program_id
          AND lower(trim(l.name)) = lower(v_starting_level)
        ORDER BY l.sort_order ASC
        LIMIT 1;

        IF v_level_id IS NULL THEN
          v_errors := v_errors || jsonb_build_array(
            jsonb_build_object('row', v_row_num, 'message', 'starting_level not found in that program')
          );
          CONTINUE;
        END IF;
      ELSE
        SELECT l.id INTO v_level_id
        FROM public.levels l
        WHERE l.program_id = v_program_id
        ORDER BY l.sort_order ASC
        LIMIT 1;

        IF v_level_id IS NULL THEN
          v_errors := v_errors || jsonb_build_array(
            jsonb_build_object('row', v_row_num, 'message', 'Program has no levels')
          );
          CONTINUE;
        END IF;
      END IF;
    END IF;

    SELECT s.id INTO v_existing
    FROM public.students s
    JOIN public.student_enrollments e ON e.student_id = s.id AND e.status = 'active' AND e.center_id = p_center_id
    JOIN public.parent_student_links psl ON psl.student_id = s.id
    JOIN public.parents p ON p.id = psl.parent_id
    WHERE s.brand_id = v_brand_id
      AND s.deleted_at IS NULL
      AND lower(trim(s.full_name)) = lower(v_student_name)
      AND p.phone_e164 = v_whatsapp_norm
    LIMIT 1;

    IF v_existing IS NOT NULL THEN
      v_skipped := v_skipped || jsonb_build_array(
        jsonb_build_object(
          'row', v_row_num,
          'student_id', v_existing,
          'message', 'Already enrolled (same student and parent WhatsApp)'
        )
      );
      CONTINUE;
    END IF;

    IF v_login_email <> '' THEN
      SELECT s.id INTO v_existing
      FROM public.students s
      WHERE s.brand_id = v_brand_id
        AND s.deleted_at IS NULL
        AND lower(trim(s.login_email)) = v_login_email
      LIMIT 1;

      IF v_existing IS NOT NULL THEN
        IF EXISTS (
          SELECT 1
          FROM public.student_enrollments e
          WHERE e.student_id = v_existing AND e.center_id = p_center_id AND e.status = 'active'
        ) THEN
          v_skipped := v_skipped || jsonb_build_array(
            jsonb_build_object(
              'row', v_row_num,
              'student_id', v_existing,
              'message', 'Already enrolled (login_email)'
            )
          );
          CONTINUE;
        END IF;

        v_errors := v_errors || jsonb_build_array(
          jsonb_build_object('row', v_row_num, 'message', 'login_email already used at this brand')
        );
        CONTINUE;
      END IF;
    END IF;

    BEGIN
      LOOP
        v_code_seq := v_code_seq + 1;
        v_student_code := 'STU-' || lpad(v_code_seq::text, 3, '0');
        EXIT WHEN NOT EXISTS (
          SELECT 1
          FROM public.students s
          WHERE s.brand_id = v_brand_id
            AND s.deleted_at IS NULL
            AND s.student_code = v_student_code
        );
      END LOOP;

      SELECT p.id INTO v_parent_id
      FROM public.parents p
      WHERE p.brand_id = v_brand_id AND p.phone_e164 = v_whatsapp_norm
      ORDER BY p.created_at ASC
      LIMIT 1;

      IF v_parent_id IS NULL THEN
        INSERT INTO public.parents (brand_id, full_name, email, phone_e164)
        VALUES (
          v_brand_id,
          v_parent_name,
          nullif(v_email, ''),
          v_whatsapp_norm
        )
        RETURNING id INTO v_parent_id;
      ELSE
        UPDATE public.parents
        SET
          full_name = CASE WHEN coalesce(trim(full_name), '') = '' THEN v_parent_name ELSE full_name END,
          email = CASE WHEN email IS NULL AND v_email <> '' THEN v_email ELSE email END,
          updated_at = now()
        WHERE id = v_parent_id;
      END IF;

      INSERT INTO public.students (
        brand_id, full_name, date_of_birth, student_code, login_email
      )
      VALUES (
        v_brand_id,
        v_student_name,
        v_child_dob,
        v_student_code,
        nullif(v_login_email, '')
      )
      RETURNING id INTO v_student_id;

      INSERT INTO public.parent_student_links (brand_id, parent_id, student_id)
      VALUES (v_brand_id, v_parent_id, v_student_id);

      INSERT INTO public.student_profiles (
        brand_id, student_id, school_name, city, pincode, address_line1, state, phone
      )
      VALUES (
        v_brand_id,
        v_student_id,
        v_school_name,
        v_city,
        v_pincode,
        v_address,
        v_state,
        v_whatsapp_norm
      );

      INSERT INTO public.student_enrollments (brand_id, center_id, student_id, status)
      VALUES (v_brand_id, p_center_id, v_student_id, 'active')
      RETURNING id INTO v_enrollment_id;

      IF v_program_id IS NOT NULL THEN
        PERFORM public.pin_enrollment_program(v_enrollment_id, v_program_id, v_level_id);
      END IF;

      v_created := v_created || jsonb_build_array(
        jsonb_build_object('row', v_row_num, 'student_id', v_student_id, 'student_code', v_student_code)
      );
    EXCEPTION
      WHEN OTHERS THEN
        v_errors := v_errors || jsonb_build_array(
          jsonb_build_object('row', v_row_num, 'message', SQLERRM)
        );
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'created', v_created,
    'skipped', v_skipped,
    'errors', v_errors
  );
END;
$$;

COMMENT ON FUNCTION public.import_center_students(uuid, jsonb) IS
  'Center staff bulk-create enrolled students + profiles from CSV JSON rows. Assigns STU-NNN student_code; profile phone copies WhatsApp. Does not create leads.';

REVOKE ALL ON FUNCTION public.import_center_students(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.import_center_students(uuid, jsonb) TO authenticated;
