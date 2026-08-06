-- Bulk import franchise centers from validated JSON rows (CSV parsed client-side)

CREATE OR REPLACE FUNCTION public.import_franchise_center_text(p_input text, p_max_len int)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_text text;
BEGIN
  IF p_input IS NULL THEN
    RETURN NULL;
  END IF;

  v_text := trim(p_input);
  IF v_text = '' THEN
    RETURN NULL;
  END IF;

  -- Neutralize CSV formula-injection prefixes (= + - @ tab)
  IF v_text ~ '^[=+\-@\t]' THEN
    v_text := ltrim(substring(v_text FROM 2));
  END IF;

  -- Strip control characters except ordinary whitespace
  v_text := regexp_replace(v_text, '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', 'g');
  v_text := trim(v_text);

  IF v_text = '' THEN
    RETURN NULL;
  END IF;

  IF char_length(v_text) > p_max_len THEN
    v_text := left(v_text, p_max_len);
  END IF;

  RETURN v_text;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_import_email(p_email text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT p_email IS NOT NULL
    AND p_email ~* '^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$'
    AND char_length(p_email) <= 320;
$$;

CREATE OR REPLACE FUNCTION public.import_franchise_centers(
  p_brand_id uuid,
  p_rows jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand public.brands%ROWTYPE;
  v_settings jsonb;
  v_max_centers int;
  v_current_count int;
  v_row jsonb;
  v_row_num int := 0;
  v_slug text;
  v_name text;
  v_city text;
  v_display_name text;
  v_region text;
  v_country text;
  v_address text;
  v_pincode text;
  v_phone text;
  v_description text;
  v_owner_email text;
  v_center_id uuid;
  v_created jsonb := '[]'::jsonb;
  v_errors jsonb := '[]'::jsonb;
  v_batch_slugs text[] := '{}'::text[];
  v_created_count int := 0;
  v_row_count int;
BEGIN
  IF p_brand_id IS NULL THEN
    RAISE EXCEPTION 'brand_id required';
  END IF;

  IF NOT (public.is_platform_admin() OR public.has_brand_access(p_brand_id)) THEN
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

  SELECT * INTO v_brand FROM public.brands WHERE id = p_brand_id AND deleted_at IS NULL;
  IF v_brand.id IS NULL THEN
    RAISE EXCEPTION 'Brand not found';
  END IF;

  SELECT coalesce(bs.settings, '{}'::jsonb)
  INTO v_settings
  FROM public.brand_settings bs
  WHERE bs.brand_id = p_brand_id;

  v_max_centers := nullif(trim(coalesce(v_settings->'features'->>'max_franchise_centers', '')), '')::int;

  SELECT count(*)::int
  INTO v_current_count
  FROM public.franchise_centers fc
  WHERE fc.brand_id = p_brand_id AND fc.deleted_at IS NULL;

  FOR v_row IN SELECT value FROM jsonb_array_elements(p_rows) LOOP
    v_row_num := v_row_num + 1;

    IF v_max_centers IS NOT NULL AND (v_current_count + v_created_count) >= v_max_centers THEN
      v_errors := v_errors || jsonb_build_array(
        jsonb_build_object('row', v_row_num, 'message', 'Brand franchise center limit reached')
      );
      CONTINUE;
    END IF;

    v_slug := public.slugify_text(v_row->>'center_slug');
    v_name := public.import_franchise_center_text(v_row->>'name', 200);
    v_city := public.import_franchise_center_text(v_row->>'city', 100);
    v_display_name := public.import_franchise_center_text(v_row->>'display_name', 200);
    v_region := public.import_franchise_center_text(v_row->>'region', 100);
    v_country := coalesce(public.import_franchise_center_text(v_row->>'country', 2), 'IN');
    v_address := public.import_franchise_center_text(v_row->>'address', 500);
    v_pincode := public.import_franchise_center_text(v_row->>'pincode', 12);
    v_phone := public.import_franchise_center_text(v_row->>'contact_phone', 32);
    v_description := public.import_franchise_center_text(v_row->>'short_description', 500);
    v_owner_email := lower(trim(coalesce(v_row->>'owner_email', '')));

    IF v_slug IS NULL OR v_slug = '' OR v_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' OR char_length(v_slug) > 48 THEN
      v_errors := v_errors || jsonb_build_array(
        jsonb_build_object('row', v_row_num, 'message', 'Invalid center_slug')
      );
      CONTINUE;
    END IF;

    IF v_name IS NULL OR v_name = '' THEN
      v_errors := v_errors || jsonb_build_array(
        jsonb_build_object('row', v_row_num, 'message', 'Name is required')
      );
      CONTINUE;
    END IF;

    IF v_city IS NULL OR v_city = '' THEN
      v_errors := v_errors || jsonb_build_array(
        jsonb_build_object('row', v_row_num, 'message', 'City is required')
      );
      CONTINUE;
    END IF;

    IF v_owner_email <> '' AND NOT public.is_import_email(v_owner_email) THEN
      v_errors := v_errors || jsonb_build_array(
        jsonb_build_object('row', v_row_num, 'message', 'Invalid owner_email')
      );
      CONTINUE;
    END IF;

    IF v_pincode IS NOT NULL AND v_pincode !~ '^\d{4,12}$' THEN
      v_errors := v_errors || jsonb_build_array(
        jsonb_build_object('row', v_row_num, 'message', 'Invalid pincode')
      );
      CONTINUE;
    END IF;

    IF v_slug = ANY (v_batch_slugs) THEN
      v_errors := v_errors || jsonb_build_array(
        jsonb_build_object('row', v_row_num, 'message', 'Duplicate center_slug in import file')
      );
      CONTINUE;
    END IF;

    IF EXISTS (
      SELECT 1 FROM public.franchise_centers fc
      WHERE fc.brand_id = p_brand_id AND fc.slug = v_slug AND fc.deleted_at IS NULL
    ) THEN
      v_errors := v_errors || jsonb_build_array(
        jsonb_build_object('row', v_row_num, 'message', 'center_slug already exists for this brand')
      );
      CONTINUE;
    END IF;

    BEGIN
      INSERT INTO public.franchise_centers (
        brand_id,
        slug,
        name,
        status,
        city,
        address_line1,
        region,
        country,
        pincode,
        display_name,
        contact_phone,
        short_description
      )
      VALUES (
        p_brand_id,
        v_slug,
        v_name,
        'active',
        v_city,
        v_address,
        v_region,
        v_country,
        v_pincode,
        coalesce(v_display_name, v_name),
        v_phone,
        v_description
      )
      RETURNING id INTO v_center_id;

      INSERT INTO public.domain_mappings (hostname, brand_id, center_id, portal_type, is_primary)
      VALUES (v_slug || '.' || v_brand.slug || '.localhost', p_brand_id, v_center_id, 'center', true);

      IF v_owner_email <> '' THEN
        INSERT INTO public.memberships (user_id, scope_type, brand_id, center_id, role_key, status, accepted_at)
        SELECT u.id, 'center', p_brand_id, v_center_id, 'center_owner', 'invited', NULL
        FROM auth.users u
        WHERE lower(u.email) = v_owner_email
        ON CONFLICT DO NOTHING;
      END IF;

      v_batch_slugs := array_append(v_batch_slugs, v_slug);
      v_created_count := v_created_count + 1;
      v_created := v_created || jsonb_build_array(
        jsonb_build_object('row', v_row_num, 'center_id', v_center_id, 'slug', v_slug)
      );
    EXCEPTION
      WHEN OTHERS THEN
        v_errors := v_errors || jsonb_build_array(
          jsonb_build_object('row', v_row_num, 'message', SQLERRM)
        );
    END;
  END LOOP;

  IF v_created_count > 0 THEN
    PERFORM public.log_platform_audit(
      'import_franchise_centers',
      'brand',
      p_brand_id,
      p_brand_id,
      NULL,
      jsonb_build_object(
        'created_count', v_created_count,
        'error_count', jsonb_array_length(v_errors),
        'row_count', v_row_count
      )
    );
  END IF;

  RETURN jsonb_build_object('created', v_created, 'errors', v_errors);
END;
$$;

REVOKE ALL ON FUNCTION public.import_franchise_center_text(text, int) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_import_email(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.import_franchise_centers(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.import_franchise_centers(uuid, jsonb) TO authenticated;
