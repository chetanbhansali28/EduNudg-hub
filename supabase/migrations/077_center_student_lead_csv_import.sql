-- Center student lead CSV import and bulk convert to students

CREATE OR REPLACE FUNCTION public.import_center_student_leads(
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
  v_parent_name text;
  v_whatsapp text;
  v_whatsapp_norm text;
  v_email text;
  v_city text;
  v_pincode text;
  v_child_name text;
  v_child_dob date;
  v_school_name text;
  v_notes text;
  v_existing_id uuid;
  v_lead_id uuid;
  v_payload jsonb;
  v_created jsonb := '[]'::jsonb;
  v_merged jsonb := '[]'::jsonb;
  v_errors jsonb := '[]'::jsonb;
  v_row_count int;
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

  FOR v_row IN SELECT value FROM jsonb_array_elements(p_rows) LOOP
    v_row_num := v_row_num + 1;

    v_parent_name := public.import_franchise_center_text(v_row->>'parent_name', 200);
    v_whatsapp := public.import_franchise_center_text(v_row->>'whatsapp', 32);
    v_email := lower(trim(coalesce(public.import_franchise_center_text(v_row->>'email', 320), '')));
    v_city := public.import_franchise_center_text(v_row->>'city', 100);
    v_pincode := public.import_franchise_center_text(v_row->>'pincode', 12);
    v_child_name := public.import_franchise_center_text(v_row->>'child_name', 200);
    v_school_name := public.import_franchise_center_text(v_row->>'school_name', 200);
    v_notes := public.import_franchise_center_text(v_row->>'notes', 1000);

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

    IF v_email = '' THEN
      v_errors := v_errors || jsonb_build_array(
        jsonb_build_object('row', v_row_num, 'message', 'email is required')
      );
      CONTINUE;
    END IF;

    IF NOT public.is_import_email(v_email) THEN
      v_errors := v_errors || jsonb_build_array(
        jsonb_build_object('row', v_row_num, 'message', 'Invalid email')
      );
      CONTINUE;
    END IF;

    IF v_pincode IS NOT NULL AND v_pincode <> '' AND v_pincode !~ '^\d{6}$' THEN
      v_errors := v_errors || jsonb_build_array(
        jsonb_build_object('row', v_row_num, 'message', 'pincode must be a 6-digit India pincode')
      );
      CONTINUE;
    END IF;

    IF nullif(trim(coalesce(v_row->>'child_dob', '')), '') IS NOT NULL THEN
      BEGIN
        v_child_dob := (v_row->>'child_dob')::date;
      EXCEPTION
        WHEN OTHERS THEN
          v_errors := v_errors || jsonb_build_array(
            jsonb_build_object('row', v_row_num, 'message', 'Invalid child_dob (use YYYY-MM-DD)')
          );
          CONTINUE;
      END;
    ELSE
      v_child_dob := NULL;
    END IF;

    SELECT l.id INTO v_existing_id
    FROM public.leads l
    WHERE l.brand_id = v_brand_id AND l.whatsapp_e164 = v_whatsapp_norm
    ORDER BY l.created_at DESC
    LIMIT 1;

    v_payload := jsonb_build_object(
      'lead_source', 'center',
      'center_id', p_center_id,
      'parent_name', v_parent_name,
      'email', v_email,
      'whatsapp_e164', v_whatsapp_norm,
      'city', nullif(v_city, ''),
      'pincode', nullif(v_pincode, ''),
      'child_name', nullif(v_child_name, ''),
      'child_dob', v_child_dob,
      'school_name', nullif(v_school_name, ''),
      'notes', coalesce(nullif(v_notes, ''), 'CSV import by center staff')
    );

    BEGIN
      v_lead_id := public.upsert_lead_by_whatsapp(v_brand_id, v_whatsapp_norm, v_payload);

      INSERT INTO public.lead_events (lead_id, brand_id, event_type, payload, created_by)
      VALUES (
        v_lead_id,
        v_brand_id,
        CASE WHEN v_existing_id IS NULL THEN 'csv_imported' ELSE 'csv_imported_merge' END,
        jsonb_build_object('scope', 'center', 'center_id', p_center_id, 'row', v_row_num),
        auth.uid()
      );

      IF v_existing_id IS NULL THEN
        v_created := v_created || jsonb_build_array(
          jsonb_build_object('row', v_row_num, 'lead_id', v_lead_id)
        );
      ELSE
        v_merged := v_merged || jsonb_build_array(
          jsonb_build_object('row', v_row_num, 'lead_id', v_lead_id)
        );
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        v_errors := v_errors || jsonb_build_array(
          jsonb_build_object('row', v_row_num, 'message', SQLERRM)
        );
    END;
  END LOOP;

  RETURN jsonb_build_object('created', v_created, 'merged', v_merged, 'errors', v_errors);
END;
$$;

CREATE OR REPLACE FUNCTION public.bulk_convert_center_leads(
  p_center_id uuid,
  p_lead_ids uuid[] DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead_id uuid;
  v_lead public.leads%ROWTYPE;
  v_student_id uuid;
  v_converted jsonb := '[]'::jsonb;
  v_errors jsonb := '[]'::jsonb;
  v_parent_name text;
  v_child_name text;
BEGIN
  IF p_center_id IS NULL THEN
    RAISE EXCEPTION 'center_id required';
  END IF;

  IF NOT public.has_center_access(p_center_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_lead_ids IS NULL THEN
    FOR v_lead IN
      SELECT *
      FROM public.leads l
      WHERE l.center_id = p_center_id
        AND l.status IN ('new', 'contacted', 'qualified')
      ORDER BY l.created_at ASC
    LOOP
      v_parent_name := coalesce(nullif(trim(v_lead.parent_name), ''), nullif(trim(v_lead.full_name), ''));
      v_child_name := nullif(trim(v_lead.child_name), '');

      IF v_parent_name IS NULL OR v_child_name IS NULL THEN
        v_errors := v_errors || jsonb_build_array(
          jsonb_build_object('lead_id', v_lead.id, 'message', 'Missing parent or child name')
        );
        CONTINUE;
      END IF;

      BEGIN
        v_student_id := public.convert_lead_to_student(v_lead.id, '{}'::jsonb);
        v_converted := v_converted || jsonb_build_array(
          jsonb_build_object('lead_id', v_lead.id, 'student_id', v_student_id)
        );
      EXCEPTION
        WHEN OTHERS THEN
          v_errors := v_errors || jsonb_build_array(
            jsonb_build_object('lead_id', v_lead.id, 'message', SQLERRM)
          );
      END;
    END LOOP;
  ELSE
    FOREACH v_lead_id IN ARRAY p_lead_ids LOOP
      SELECT * INTO v_lead FROM public.leads WHERE id = v_lead_id;

      IF v_lead.id IS NULL OR v_lead.center_id IS DISTINCT FROM p_center_id THEN
        v_errors := v_errors || jsonb_build_array(
          jsonb_build_object('lead_id', v_lead_id, 'message', 'Lead not found for this center')
        );
        CONTINUE;
      END IF;

      IF v_lead.status IN ('converted', 'lost') THEN
        v_errors := v_errors || jsonb_build_array(
          jsonb_build_object('lead_id', v_lead_id, 'message', 'Lead is not open for conversion')
        );
        CONTINUE;
      END IF;

      v_parent_name := coalesce(nullif(trim(v_lead.parent_name), ''), nullif(trim(v_lead.full_name), ''));
      v_child_name := nullif(trim(v_lead.child_name), '');

      IF v_parent_name IS NULL OR v_child_name IS NULL THEN
        v_errors := v_errors || jsonb_build_array(
          jsonb_build_object('lead_id', v_lead_id, 'message', 'Missing parent or child name')
        );
        CONTINUE;
      END IF;

      BEGIN
        v_student_id := public.convert_lead_to_student(v_lead.id, '{}'::jsonb);
        v_converted := v_converted || jsonb_build_array(
          jsonb_build_object('lead_id', v_lead.id, 'student_id', v_student_id)
        );
      EXCEPTION
        WHEN OTHERS THEN
          v_errors := v_errors || jsonb_build_array(
            jsonb_build_object('lead_id', v_lead.id, 'message', SQLERRM)
          );
      END;
    END LOOP;
  END IF;

  RETURN jsonb_build_object('converted', v_converted, 'errors', v_errors);
END;
$$;

REVOKE ALL ON FUNCTION public.import_center_student_leads(uuid, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bulk_convert_center_leads(uuid, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.import_center_student_leads(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_convert_center_leads(uuid, uuid[]) TO authenticated;
