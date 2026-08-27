-- Auth audit: tenant columns, session dedup, SECURITY DEFINER writer for login/logout/failure.
-- Append-only; clients never pass IP (Edge Function auth-audit stamps network fields).

ALTER TABLE public.auth_audit_logs
  ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES public.brands(id),
  ADD COLUMN IF NOT EXISTS center_id uuid REFERENCES public.franchise_centers(id),
  ADD COLUMN IF NOT EXISTS portal text,
  ADD COLUMN IF NOT EXISTS session_id text,
  ADD COLUMN IF NOT EXISTS ip_hash text,
  ADD COLUMN IF NOT EXISTS ip_country text;

CREATE INDEX IF NOT EXISTS auth_audit_logs_created_at_idx
  ON public.auth_audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS auth_audit_logs_user_created_idx
  ON public.auth_audit_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS auth_audit_logs_brand_created_idx
  ON public.auth_audit_logs (brand_id, created_at DESC)
  WHERE brand_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS auth_audit_logs_session_event_idx
  ON public.auth_audit_logs (session_id, event_type, created_at DESC)
  WHERE session_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.log_auth_audit_event(
  p_event_type text,
  p_provider public.auth_provider DEFAULT NULL,
  p_session_id text DEFAULT NULL,
  p_portal text DEFAULT NULL,
  p_brand_id uuid DEFAULT NULL,
  p_center_id uuid DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_identifier text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_event text := lower(trim(coalesce(p_event_type, '')));
  v_portal text := nullif(lower(trim(coalesce(p_portal, ''))), '');
  v_meta jsonb := coalesce(p_metadata, '{}'::jsonb);
  v_identifier text := nullif(lower(trim(coalesce(p_identifier, ''))), '');
  v_hash text;
  v_brand uuid := p_brand_id;
  v_center uuid := p_center_id;
  v_id uuid;
  v_existing uuid;
  v_fail_count int;
BEGIN
  IF v_event NOT IN ('login_success', 'login_failure', 'logout', 'access_denied') THEN
    RAISE EXCEPTION 'invalid auth audit event';
  END IF;

  IF v_portal IS NOT NULL AND v_portal NOT IN ('platform', 'brand', 'center', 'learn', 'parents') THEN
    v_portal := NULL;
  END IF;

  v_meta := v_meta
    - 'password'
    - 'access_token'
    - 'refresh_token'
    - 'apikey'
    - 'token'
    - 'Authorization';

  IF v_event = 'login_failure' THEN
    IF v_uid IS NOT NULL THEN
      RAISE EXCEPTION 'login_failure is anonymous-only';
    END IF;
  ELSE
    IF v_uid IS NULL THEN
      RAISE EXCEPTION 'auth required';
    END IF;
  END IF;

  IF v_uid IS NOT NULL AND v_portal IN ('platform', 'brand', 'center') THEN
    IF v_brand IS NOT NULL AND NOT (public.is_platform_admin() OR public.has_brand_access(v_brand)) THEN
      v_brand := NULL;
    END IF;
    IF v_center IS NOT NULL AND NOT (public.is_platform_admin() OR public.has_center_access(v_center)) THEN
      v_center := NULL;
    END IF;
  END IF;

  IF v_identifier IS NOT NULL THEN
    v_hash := encode(digest(v_identifier, 'sha256'), 'hex');
    v_meta := v_meta || jsonb_build_object('identifier', v_identifier, 'identifier_hash', v_hash);
  END IF;

  IF v_event = 'login_failure' AND v_hash IS NOT NULL THEN
    SELECT count(*)::int INTO v_fail_count
    FROM public.auth_audit_logs
    WHERE event_type = 'login_failure'
      AND metadata->>'identifier_hash' = v_hash
      AND created_at > now() - interval '1 hour';
    IF v_fail_count >= 20 THEN
      RETURN NULL;
    END IF;
  END IF;

  IF v_event = 'login_success' AND nullif(trim(coalesce(p_session_id, '')), '') IS NOT NULL THEN
    SELECT id INTO v_existing
    FROM public.auth_audit_logs
    WHERE session_id = trim(p_session_id)
      AND event_type = 'login_success'
      AND created_at > now() - interval '12 hours'
    ORDER BY created_at DESC
    LIMIT 1;
    IF v_existing IS NOT NULL THEN
      RETURN NULL;
    END IF;
  END IF;

  BEGIN
    INSERT INTO public.auth_audit_logs (
      user_id,
      event_type,
      provider,
      user_agent,
      metadata,
      brand_id,
      center_id,
      portal,
      session_id,
      created_by
    )
    VALUES (
      v_uid,
      v_event,
      p_provider,
      left(nullif(trim(coalesce(p_user_agent, '')), ''), 512),
      v_meta,
      v_brand,
      v_center,
      v_portal,
      nullif(trim(coalesce(p_session_id, '')), ''),
      v_uid
    )
    RETURNING id INTO v_id;
  EXCEPTION
    WHEN foreign_key_violation THEN
      INSERT INTO public.auth_audit_logs (
        user_id,
        event_type,
        provider,
        user_agent,
        metadata,
        brand_id,
        center_id,
        portal,
        session_id,
        created_by
      )
      VALUES (
        v_uid,
        v_event,
        p_provider,
        left(nullif(trim(coalesce(p_user_agent, '')), ''), 512),
        v_meta,
        NULL,
        NULL,
        v_portal,
        nullif(trim(coalesce(p_session_id, '')), ''),
        v_uid
      )
      RETURNING id INTO v_id;
  END;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_auth_audit_event(
  text, public.auth_provider, text, text, uuid, uuid, text, jsonb, text
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.log_auth_audit_event(
  text, public.auth_provider, text, text, uuid, uuid, text, jsonb, text
) TO anon, authenticated;

COMMENT ON FUNCTION public.log_auth_audit_event(
  text, public.auth_provider, text, text, uuid, uuid, text, jsonb, text
) IS 'Append auth audit row. Anon: login_failure only. Authenticated: self user_id. No client IP.';
