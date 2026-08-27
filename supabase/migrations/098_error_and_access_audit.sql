-- Phase B/C: client fatal errors (platform-only read) + sensitive access logs (tenant-scoped).

CREATE TABLE public.client_error_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  brand_id uuid REFERENCES public.brands(id),
  center_id uuid REFERENCES public.franchise_centers(id),
  portal text,
  route text,
  message text NOT NULL,
  stack text,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX client_error_reports_created_at_idx ON public.client_error_reports (created_at DESC);

CREATE TABLE public.access_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  brand_id uuid REFERENCES public.brands(id),
  center_id uuid REFERENCES public.franchise_centers(id),
  portal text,
  path text,
  ip_address inet,
  ip_hash text,
  ip_country text,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX access_audit_logs_created_at_idx ON public.access_audit_logs (created_at DESC);
CREATE INDEX access_audit_logs_brand_created_idx ON public.access_audit_logs (brand_id, created_at DESC) WHERE brand_id IS NOT NULL;
CREATE INDEX access_audit_logs_center_created_idx ON public.access_audit_logs (center_id, created_at DESC) WHERE center_id IS NOT NULL;

ALTER TABLE public.client_error_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY client_error_reports_platform_read ON public.client_error_reports
  FOR SELECT TO authenticated
  USING (public.is_platform_admin());

CREATE POLICY access_audit_platform_read ON public.access_audit_logs
  FOR SELECT TO authenticated
  USING (public.is_platform_admin());

CREATE OR REPLACE FUNCTION public.can_read_staff_audit(p_brand_id uuid, p_center_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_platform_admin()
    OR (
      p_center_id IS NOT NULL
      AND public.has_center_access(p_center_id)
      AND EXISTS (
        SELECT 1 FROM public.memberships m
        WHERE m.user_id = auth.uid()
          AND m.status = 'active'
          AND m.center_id = p_center_id
          AND m.role_key IN ('center_owner', 'center_manager')
      )
    )
    OR (
      p_brand_id IS NOT NULL
      AND p_center_id IS NULL
      AND public.has_brand_access(p_brand_id)
      AND EXISTS (
        SELECT 1 FROM public.memberships m
        WHERE m.user_id = auth.uid()
          AND m.status = 'active'
          AND m.scope_type = 'brand'
          AND m.brand_id = p_brand_id
          AND m.role_key IN ('brand_owner', 'brand_admin')
      )
    );
$$;

CREATE OR REPLACE FUNCTION public.log_client_error_event(
  p_message text,
  p_stack text DEFAULT NULL,
  p_route text DEFAULT NULL,
  p_portal text DEFAULT NULL,
  p_brand_id uuid DEFAULT NULL,
  p_center_id uuid DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_msg text := left(nullif(trim(coalesce(p_message, '')), ''), 500);
  v_portal text := nullif(lower(trim(coalesce(p_portal, ''))), '');
  v_meta jsonb := coalesce(p_metadata, '{}'::jsonb);
  v_count int;
  v_id uuid;
BEGIN
  IF v_msg IS NULL THEN
    RETURN NULL;
  END IF;
  IF v_portal IS NOT NULL AND v_portal NOT IN ('platform', 'brand', 'center', 'learn', 'parents') THEN
    v_portal := NULL;
  END IF;
  v_meta := v_meta - 'password' - 'access_token' - 'refresh_token' - 'apikey' - 'token';

  SELECT count(*)::int INTO v_count
  FROM public.client_error_reports
  WHERE created_at > now() - interval '1 hour'
    AND (
      (v_uid IS NOT NULL AND user_id = v_uid)
      OR (v_uid IS NULL AND user_agent IS NOT DISTINCT FROM left(nullif(trim(coalesce(p_user_agent, '')), ''), 512))
    );
  IF v_count >= 20 THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.client_error_reports (
    user_id, brand_id, center_id, portal, route, message, stack, user_agent, metadata, created_by
  ) VALUES (
    v_uid,
    p_brand_id,
    p_center_id,
    v_portal,
    left(nullif(trim(coalesce(p_route, '')), ''), 300),
    v_msg,
    left(nullif(p_stack, ''), 4000),
    left(nullif(trim(coalesce(p_user_agent, '')), ''), 512),
    v_meta,
    v_uid
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_access_audit_event(
  p_action text,
  p_resource_type text,
  p_resource_id uuid DEFAULT NULL,
  p_portal text DEFAULT NULL,
  p_brand_id uuid DEFAULT NULL,
  p_center_id uuid DEFAULT NULL,
  p_path text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_action text := lower(trim(coalesce(p_action, '')));
  v_portal text := nullif(lower(trim(coalesce(p_portal, ''))), '');
  v_brand uuid := p_brand_id;
  v_center uuid := p_center_id;
  v_meta jsonb := coalesce(p_metadata, '{}'::jsonb);
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth required';
  END IF;
  IF v_action NOT IN ('export', 'view_pii', 'credentials', 'handoff') THEN
    RAISE EXCEPTION 'invalid access audit action';
  END IF;
  IF v_portal IS NOT NULL AND v_portal NOT IN ('platform', 'brand', 'center', 'learn', 'parents') THEN
    v_portal := NULL;
  END IF;
  v_meta := v_meta - 'password' - 'access_token' - 'refresh_token' - 'apikey' - 'token';

  IF v_brand IS NOT NULL AND NOT (public.is_platform_admin() OR public.has_brand_access(v_brand)) THEN
    v_brand := NULL;
  END IF;
  IF v_center IS NOT NULL AND NOT (public.is_platform_admin() OR public.has_center_access(v_center)) THEN
    v_center := NULL;
  END IF;

  INSERT INTO public.access_audit_logs (
    actor_id, action, resource_type, resource_id, brand_id, center_id, portal, path, user_agent, metadata, created_by
  ) VALUES (
    v_uid,
    v_action,
    left(nullif(trim(coalesce(p_resource_type, '')), ''), 80),
    p_resource_id,
    v_brand,
    v_center,
    v_portal,
    left(nullif(trim(coalesce(p_path, '')), ''), 300),
    left(nullif(trim(coalesce(p_user_agent, '')), ''), 512),
    v_meta,
    v_uid
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_client_error_event(text, text, text, text, uuid, uuid, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_client_error_event(text, text, text, text, uuid, uuid, text, jsonb) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.log_access_audit_event(text, text, uuid, text, uuid, uuid, text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_access_audit_event(text, text, uuid, text, uuid, uuid, text, text, jsonb) TO authenticated;

REVOKE ALL ON FUNCTION public.can_read_staff_audit(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_read_staff_audit(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.list_tenant_staff_audit(
  p_brand_id uuid DEFAULT NULL,
  p_center_id uuid DEFAULT NULL,
  p_limit int DEFAULT 500
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit int := GREATEST(1, LEAST(COALESCE(p_limit, 500), 2000));
  v_out jsonb;
BEGIN
  IF NOT public.can_read_staff_audit(p_brand_id, p_center_id) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT coalesce(jsonb_agg(to_jsonb(q) ORDER BY q.created_at DESC), '[]'::jsonb)
  INTO v_out
  FROM (
    SELECT
      a.id::text AS id,
      a.created_at,
      'auth'::text AS source,
      CASE a.event_type WHEN 'login_success' THEN 'login' ELSE a.event_type END AS action,
      'auth'::text AS resource_type,
      a.user_id AS actor_id,
      a.created_by,
      a.user_id AS resource_id,
      a.brand_id,
      a.center_id,
      a.portal,
      NULL::text AS ip_address,
      a.ip_country,
      CASE
        WHEN a.event_type = 'login_failure' THEN
          (coalesce(a.metadata, '{}'::jsonb) - 'identifier' - 'email' - 'ip_address')
            || jsonb_build_object('event_type', a.event_type, 'provider', a.provider, 'portal', a.portal)
        ELSE
          (coalesce(a.metadata, '{}'::jsonb) - 'identifier' - 'ip_address')
            || jsonb_build_object('event_type', a.event_type, 'provider', a.provider, 'portal', a.portal)
      END AS payload
    FROM public.auth_audit_logs a
    WHERE (
      (p_center_id IS NOT NULL AND a.center_id = p_center_id)
      OR (
        p_center_id IS NULL
        AND p_brand_id IS NOT NULL
        AND (
          a.brand_id = p_brand_id
          OR a.center_id IN (SELECT fc.id FROM public.franchise_centers fc WHERE fc.brand_id = p_brand_id)
        )
      )
    )
    UNION ALL
    SELECT
      x.id::text,
      x.created_at,
      'access'::text,
      x.action,
      x.resource_type,
      x.actor_id,
      x.created_by,
      x.resource_id,
      x.brand_id,
      x.center_id,
      x.portal,
      NULL::text,
      x.ip_country,
      coalesce(x.metadata, '{}'::jsonb) || jsonb_build_object('path', x.path)
    FROM public.access_audit_logs x
    WHERE (
      (p_center_id IS NOT NULL AND x.center_id = p_center_id)
      OR (
        p_center_id IS NULL
        AND p_brand_id IS NOT NULL
        AND (
          x.brand_id = p_brand_id
          OR x.center_id IN (SELECT fc.id FROM public.franchise_centers fc WHERE fc.brand_id = p_brand_id)
        )
      )
    )
    ORDER BY created_at DESC
    LIMIT v_limit
  ) q;

  RETURN v_out;
END;
$$;

REVOKE ALL ON FUNCTION public.list_tenant_staff_audit(uuid, uuid, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_tenant_staff_audit(uuid, uuid, int) TO authenticated;
