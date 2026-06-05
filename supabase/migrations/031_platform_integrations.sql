-- Platform integration toggles (platform_settings.integrations) + RPC guards

INSERT INTO public.platform_settings (key, value)
VALUES (
  'integrations',
  jsonb_build_object(
    'auth_email', true,
    'auth_google', true,
    'auth_facebook', true,
    'auth_whatsapp_otp', false,
    'passkeys', false,
    'payment_gateway', false,
    'platform_brand_signup', true,
    'public_pricing', true
  )
)
ON CONFLICT (key) DO UPDATE
SET value = public.platform_settings.value || EXCLUDED.value;

CREATE OR REPLACE FUNCTION public.platform_integration_enabled(p_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT (ps.value ->> p_key)::boolean
      FROM public.platform_settings ps
      WHERE ps.key = 'integrations'
      LIMIT 1
    ),
    CASE p_key
      WHEN 'auth_email' THEN true
      WHEN 'auth_google' THEN true
      WHEN 'auth_facebook' THEN true
      WHEN 'platform_brand_signup' THEN true
      WHEN 'public_pricing' THEN true
      ELSE false
    END
  );
$$;

DROP POLICY IF EXISTS platform_settings_integrations_public_read ON public.platform_settings;
CREATE POLICY platform_settings_integrations_public_read ON public.platform_settings
  FOR SELECT TO anon, authenticated
  USING (key = 'integrations');

CREATE OR REPLACE FUNCTION public.submit_platform_brand_signup(
  p_requested_name text,
  p_admin_full_name text,
  p_email text,
  p_city text,
  p_phone_e164 text DEFAULT NULL,
  p_country text DEFAULT 'IN',
  p_message text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT public.platform_integration_enabled('platform_brand_signup') THEN
    RAISE EXCEPTION 'integration_disabled';
  END IF;

  IF trim(p_requested_name) = '' OR trim(p_admin_full_name) = '' OR trim(p_email) = '' OR trim(p_city) = '' THEN
    RAISE EXCEPTION 'requested_name, admin_full_name, email, and city are required';
  END IF;

  INSERT INTO public.platform_brand_signups (
    requested_name, admin_full_name, email, phone_e164, city, country, message, status
  )
  VALUES (
    trim(p_requested_name),
    trim(p_admin_full_name),
    trim(lower(p_email)),
    public.normalize_phone_e164(p_phone_e164),
    trim(p_city),
    coalesce(nullif(trim(p_country), ''), 'IN'),
    nullif(trim(p_message), ''),
    'pending'
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    SELECT s.id INTO v_id FROM public.platform_brand_signups s
    WHERE lower(s.email) = trim(lower(p_email)) AND s.status = 'pending'
    LIMIT 1;
  END IF;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_brand_subscription_checkout(p_brand_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_brand_access(p_brand_id) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  IF NOT public.platform_integration_enabled('payment_gateway') THEN
    RETURN jsonb_build_object(
      'status', 'disabled',
      'message', 'Payment gateway is disabled by platform admin.'
    );
  END IF;
  IF NOT public.brand_feature_enabled(p_brand_id, 'brand_billing') THEN
    RAISE EXCEPTION 'feature_disabled';
  END IF;
  RETURN jsonb_build_object('status', 'stub', 'message', 'Configure payment gateway integration');
END;
$$;

CREATE OR REPLACE FUNCTION public.list_public_subscription_plans()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN public.platform_integration_enabled('public_pricing') THEN COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'code', sp.code,
            'name', sp.name,
            'price_cents', sp.price_cents,
            'currency', sp.currency,
            'billing_interval', sp.billing_interval,
            'features', sp.features,
            'is_default', sp.is_default
          )
          ORDER BY sp.price_cents ASC, sp.created_at ASC
        )
        FROM public.subscription_plans sp
        WHERE sp.is_active = true
      ),
      '[]'::jsonb
    )
    ELSE '[]'::jsonb
  END;
$$;

REVOKE ALL ON FUNCTION public.platform_integration_enabled(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.platform_integration_enabled(text) TO authenticated;
