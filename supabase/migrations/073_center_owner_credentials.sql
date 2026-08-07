-- Brand staff (or platform admin): read center owner login email + sync membership
-- after Auth user provisioning via center-owner-credentials edge function.

-- Collapse duplicate center_owner rows before the unique partial index.
DELETE FROM public.memberships a
USING public.memberships b
WHERE a.center_id IS NOT NULL
  AND a.center_id = b.center_id
  AND a.scope_type = 'center'
  AND a.role_key = 'center_owner'
  AND b.scope_type = 'center'
  AND b.role_key = 'center_owner'
  AND a.id < b.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_memberships_single_center_owner
  ON public.memberships (center_id)
  WHERE scope_type = 'center' AND role_key = 'center_owner';

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

  RETURN v_email;
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

  -- Service-role callers pass p_actor_id; auth.uid() is null — check actor memberships directly.
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

REVOKE ALL ON FUNCTION public.get_center_owner_login(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_center_owner_login(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.sync_center_owner_membership(uuid, uuid, text, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_center_owner_membership(uuid, uuid, text, text, uuid) TO service_role;
