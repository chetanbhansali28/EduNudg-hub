-- Persist franchise owner email from CSV import and credential sync for center settings display.

ALTER TABLE public.franchise_centers
  ADD COLUMN IF NOT EXISTS owner_email text;

COMMENT ON COLUMN public.franchise_centers.owner_email IS
  'Designated center owner login email (CSV import or Franchise Identity credentials).';

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
        short_description,
        owner_email
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
        v_description,
        nullif(v_owner_email, '')
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

CREATE OR REPLACE FUNCTION public.sync_center_owner_membership(
  p_center_id uuid,
  p_user_id uuid,
  p_email text,
  p_full_name text DEFAULT NULL,
  p_actor_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_center public.franchise_centers%ROWTYPE;
  v_brand public.brands%ROWTYPE;
  v_actor uuid := coalesce(p_actor_id, auth.uid());
  v_email text := lower(trim(p_email));
  v_name text := nullif(trim(p_full_name), '');
  v_hostname text;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'actor required';
  END IF;

  IF p_center_id IS NULL OR p_user_id IS NULL OR v_email IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'center_id, user_id, and email are required';
  END IF;

  SELECT * INTO v_center
  FROM public.franchise_centers fc
  WHERE fc.id = p_center_id
    AND fc.deleted_at IS NULL;

  IF v_center.id IS NULL THEN
    RAISE EXCEPTION 'Center not found';
  END IF;

  SELECT * INTO v_brand
  FROM public.brands b
  WHERE b.id = v_center.brand_id
    AND b.deleted_at IS NULL;

  IF v_brand.id IS NULL THEN
    RAISE EXCEPTION 'Brand not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.memberships m
    WHERE m.user_id = v_actor
      AND m.status = 'active'
      AND (
        (m.scope_type = 'platform' AND m.role_key IN ('platform_super_admin', 'platform_ops'))
        OR (m.scope_type = 'brand' AND m.brand_id = v_center.brand_id)
      )
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.profiles (id, email, full_name)
  VALUES (p_user_id, v_email, coalesce(v_name, v_center.name))
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = coalesce(EXCLUDED.full_name, public.profiles.full_name),
    updated_at = now();

  INSERT INTO public.memberships (
    user_id,
    scope_type,
    brand_id,
    center_id,
    role_key,
    status,
    accepted_at
  )
  VALUES (
    p_user_id,
    'center',
    v_center.brand_id,
    p_center_id,
    'center_owner',
    'active',
    now()
  )
  ON CONFLICT (center_id) WHERE scope_type = 'center' AND role_key = 'center_owner'
  DO UPDATE SET
    user_id = EXCLUDED.user_id,
    brand_id = EXCLUDED.brand_id,
    status = 'active',
    accepted_at = coalesce(public.memberships.accepted_at, now()),
    updated_at = now();

  UPDATE public.franchise_centers
  SET owner_email = v_email, updated_at = now()
  WHERE id = p_center_id;

  v_hostname := v_center.slug || '.' || v_brand.slug || '.localhost';
  INSERT INTO public.domain_mappings (hostname, portal_type, brand_id, center_id, is_primary)
  VALUES (v_hostname, 'center', v_center.brand_id, p_center_id, true)
  ON CONFLICT (hostname) DO UPDATE SET
    brand_id = EXCLUDED.brand_id,
    center_id = EXCLUDED.center_id,
    portal_type = EXCLUDED.portal_type,
    updated_at = now();

  INSERT INTO public.platform_audit_logs (
    actor_id,
    action,
    resource_type,
    resource_id,
    brand_id,
    payload,
    created_by
  )
  VALUES (
    v_actor,
    'upsert_center_owner_credentials',
    'franchise_center',
    p_center_id,
    v_center.brand_id,
    jsonb_build_object(
      'login_email', v_email,
      'user_id', p_user_id,
      'center_id', p_center_id
    ),
    v_actor
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_center_owner_login(p_center_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_id uuid;
  v_email text;
BEGIN
  IF p_center_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT fc.brand_id INTO v_brand_id
  FROM public.franchise_centers fc
  WHERE fc.id = p_center_id
    AND fc.deleted_at IS NULL;

  IF v_brand_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF NOT public.is_platform_admin() AND NOT public.has_brand_access(v_brand_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT p.email INTO v_email
  FROM public.memberships m
  INNER JOIN public.profiles p ON p.id = m.user_id
  WHERE m.center_id = p_center_id
    AND m.scope_type = 'center'
    AND m.role_key = 'center_owner'
    AND m.status = 'active'
  ORDER BY m.updated_at DESC
  LIMIT 1;

  IF v_email IS NOT NULL AND v_email <> '' THEN
    RETURN v_email;
  END IF;

  SELECT fc.owner_email INTO v_email
  FROM public.franchise_centers fc
  WHERE fc.id = p_center_id;

  RETURN v_email;
END;
$$;

REVOKE ALL ON FUNCTION public.import_franchise_centers(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.import_franchise_centers(uuid, jsonb) TO authenticated;
