-- Subscription plans: default plan flag, public pricing RPC, plan-driven brand provisioning

ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS subscription_plans_single_default
  ON public.subscription_plans (is_default)
  WHERE is_default = true;

CREATE OR REPLACE FUNCTION public.ensure_single_default_subscription_plan()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.is_default THEN
    UPDATE public.subscription_plans
    SET is_default = false, updated_at = now()
    WHERE id IS DISTINCT FROM NEW.id AND is_default;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS subscription_plans_single_default ON public.subscription_plans;
CREATE TRIGGER subscription_plans_single_default
  BEFORE INSERT OR UPDATE OF is_default ON public.subscription_plans
  FOR EACH ROW
  WHEN (NEW.is_default)
  EXECUTE FUNCTION public.ensure_single_default_subscription_plan();

-- Seed / normalize plan feature payloads (empty = unlimited for numeric limits)
UPDATE public.subscription_plans SET features = jsonb_build_object(
  'max_franchise_centers', 3,
  'max_students', 200,
  'white_labeling', false,
  'whatsapp_operations', false,
  'student_leads', true,
  'franchise_applications', true,
  'brand_billing', true,
  'campaigns', false,
  'kits', false,
  'custom_domain', false,
  'priority_support', false
), is_default = true
WHERE code = 'starter';

UPDATE public.subscription_plans SET features = jsonb_build_object(
  'max_franchise_centers', 15,
  'max_students', 2000,
  'white_labeling', true,
  'whatsapp_operations', true,
  'student_leads', true,
  'franchise_applications', true,
  'brand_billing', true,
  'campaigns', true,
  'kits', false,
  'custom_domain', false,
  'priority_support', false
), is_default = false
WHERE code = 'growth';

UPDATE public.subscription_plans SET features = jsonb_build_object(
  'max_franchise_centers', null,
  'max_students', null,
  'white_labeling', true,
  'whatsapp_operations', true,
  'student_leads', true,
  'franchise_applications', true,
  'brand_billing', true,
  'campaigns', true,
  'kits', true,
  'custom_domain', true,
  'priority_support', true
), is_default = false
WHERE code = 'enterprise';

-- If no default is set, mark cheapest active plan as default
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE is_default = true AND is_active = true) THEN
    UPDATE public.subscription_plans sp
    SET is_default = true
    WHERE sp.id = (
      SELECT id FROM public.subscription_plans
      WHERE is_active = true
      ORDER BY price_cents ASC, created_at ASC
      LIMIT 1
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_public_subscription_plans()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_agg(
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
    ),
    '[]'::jsonb
  )
  FROM public.subscription_plans sp
  WHERE sp.is_active = true;
$$;

REVOKE ALL ON FUNCTION public.list_public_subscription_plans() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_public_subscription_plans() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.approve_platform_brand_signup(p_signup_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_signup public.platform_brand_signups%ROWTYPE;
  v_slug text;
  v_brand_id uuid;
  v_plan_id uuid;
  v_plan_features jsonb;
  v_suffix int := 2;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'platform_admin required';
  END IF;

  SELECT * INTO v_signup FROM public.platform_brand_signups WHERE id = p_signup_id FOR UPDATE;
  IF v_signup.id IS NULL OR v_signup.status != 'pending' THEN
    RAISE EXCEPTION 'Signup not found or not pending';
  END IF;

  v_slug := public.slugify_text(v_signup.requested_name) || '-' || public.slugify_text(v_signup.city);

  WHILE EXISTS (SELECT 1 FROM public.brands b WHERE b.slug = v_slug AND b.deleted_at IS NULL) LOOP
    v_slug := public.slugify_text(v_signup.requested_name) || '-' || public.slugify_text(v_signup.city) || '-' || v_suffix::text;
    v_suffix := v_suffix + 1;
  END LOOP;

  INSERT INTO public.brands (slug, name, status)
  VALUES (v_slug, v_signup.requested_name, 'active')
  RETURNING id INTO v_brand_id;

  SELECT sp.id, coalesce(sp.features, '{}'::jsonb)
  INTO v_plan_id, v_plan_features
  FROM public.subscription_plans sp
  WHERE sp.is_default = true AND sp.is_active = true
  LIMIT 1;

  IF v_plan_id IS NULL THEN
    SELECT sp.id, coalesce(sp.features, '{}'::jsonb)
    INTO v_plan_id, v_plan_features
    FROM public.subscription_plans sp
    WHERE sp.is_active = true
    ORDER BY sp.price_cents ASC, sp.created_at ASC
    LIMIT 1;
  END IF;

  INSERT INTO public.brand_settings (brand_id, settings)
  VALUES (
    v_brand_id,
    jsonb_build_object(
      'timezone', 'Asia/Kolkata',
      'lead_stale_days', 15,
      'features', jsonb_build_object(
        'student_leads', coalesce((v_plan_features->>'student_leads')::boolean, true),
        'franchise_applications', coalesce((v_plan_features->>'franchise_applications')::boolean, true),
        'brand_billing', coalesce((v_plan_features->>'brand_billing')::boolean, true),
        'kits', coalesce((v_plan_features->>'kits')::boolean, false),
        'campaigns', coalesce((v_plan_features->>'campaigns')::boolean, false)
      ),
      'integrations', jsonb_build_object(
        'payment_gateway', false,
        'auth_google', true,
        'whatsapp_otp', coalesce((v_plan_features->>'whatsapp_operations')::boolean, false)
      ),
      'plan_limits', jsonb_build_object(
        'max_franchise_centers', v_plan_features->'max_franchise_centers',
        'max_students', v_plan_features->'max_students'
      ),
      'white_labeling', coalesce((v_plan_features->>'white_labeling')::boolean, false)
    )
  );

  INSERT INTO public.domain_mappings (hostname, portal_type, brand_id, is_primary)
  VALUES (v_slug || '.localhost', 'brand', v_brand_id, true);

  IF v_plan_id IS NOT NULL THEN
    INSERT INTO public.brand_subscriptions (brand_id, plan_id, status)
    VALUES (v_brand_id, v_plan_id, 'active');
  END IF;

  INSERT INTO public.memberships (user_id, scope_type, brand_id, role_key, status, accepted_at)
  SELECT u.id, 'brand', v_brand_id, 'brand_owner', 'invited', NULL
  FROM auth.users u
  WHERE lower(u.email) = lower(v_signup.email)
  ON CONFLICT DO NOTHING;

  UPDATE public.platform_brand_signups
  SET status = 'approved', proposed_slug = v_slug, converted_brand_id = v_brand_id, updated_at = now()
  WHERE id = p_signup_id;

  RETURN v_brand_id;
END;
$$;
