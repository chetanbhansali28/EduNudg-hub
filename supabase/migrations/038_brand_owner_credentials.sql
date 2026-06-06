-- Platform admin: read brand owner login email + sync membership after Auth user provisioning

CREATE UNIQUE INDEX IF NOT EXISTS idx_memberships_single_brand_owner
  ON public.memberships (brand_id)
  WHERE scope_type = 'brand' AND role_key = 'brand_owner';

CREATE OR REPLACE FUNCTION public.get_brand_owner_login(p_brand_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'platform_admin required';
  END IF;

  IF p_brand_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT p.email INTO v_email
  FROM public.memberships m
  INNER JOIN public.profiles p ON p.id = m.user_id
  WHERE m.brand_id = p_brand_id
    AND m.scope_type = 'brand'
    AND m.role_key = 'brand_owner'
    AND m.status = 'active'
  ORDER BY m.updated_at DESC
  LIMIT 1;

  RETURN v_email;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_brand_owner_membership(
  p_brand_id uuid,
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
  v_brand public.brands%ROWTYPE;
  v_actor uuid := coalesce(p_actor_id, auth.uid());
  v_email text := lower(trim(p_email));
  v_name text := nullif(trim(p_full_name), '');
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'actor required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.memberships m
    WHERE m.user_id = v_actor
      AND m.scope_type = 'platform'
      AND m.role_key IN ('platform_super_admin', 'platform_ops')
      AND m.status = 'active'
  ) THEN
    RAISE EXCEPTION 'platform_admin required';
  END IF;

  IF p_brand_id IS NULL OR p_user_id IS NULL OR v_email IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'brand_id, user_id, and email are required';
  END IF;

  SELECT * INTO v_brand
  FROM public.brands b
  WHERE b.id = p_brand_id
    AND b.deleted_at IS NULL;

  IF v_brand.id IS NULL THEN
    RAISE EXCEPTION 'Brand not found';
  END IF;

  INSERT INTO public.profiles (id, email, full_name)
  VALUES (p_user_id, v_email, coalesce(v_name, v_brand.name))
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = coalesce(EXCLUDED.full_name, public.profiles.full_name),
    updated_at = now();

  INSERT INTO public.memberships (
    user_id,
    scope_type,
    brand_id,
    role_key,
    status,
    accepted_at
  )
  VALUES (p_user_id, 'brand', p_brand_id, 'brand_owner', 'active', now())
  ON CONFLICT (brand_id) WHERE scope_type = 'brand' AND role_key = 'brand_owner'
  DO UPDATE SET
    user_id = EXCLUDED.user_id,
    status = 'active',
    accepted_at = coalesce(public.memberships.accepted_at, now()),
    updated_at = now();

  INSERT INTO public.domain_mappings (hostname, portal_type, brand_id, is_primary)
  VALUES (v_brand.slug || '.localhost', 'brand', p_brand_id, true)
  ON CONFLICT (hostname) DO UPDATE SET
    brand_id = EXCLUDED.brand_id,
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
    'upsert_owner_credentials',
    'brand',
    p_brand_id,
    p_brand_id,
    jsonb_build_object('login_email', v_email, 'user_id', p_user_id),
    v_actor
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_brand_owner_login(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_brand_owner_login(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.sync_brand_owner_membership(uuid, uuid, text, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_brand_owner_membership(uuid, uuid, text, text, uuid) TO service_role;
