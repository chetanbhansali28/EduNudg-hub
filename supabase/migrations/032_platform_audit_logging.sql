-- Platform audit log helper + emit events from key admin RPCs

CREATE OR REPLACE FUNCTION public.log_platform_audit(
  p_action text,
  p_resource_type text,
  p_resource_id uuid DEFAULT NULL,
  p_brand_id uuid DEFAULT NULL,
  p_center_id uuid DEFAULT NULL,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.platform_audit_logs (
    actor_id,
    action,
    resource_type,
    resource_id,
    brand_id,
    center_id,
    payload,
    created_by
  )
  VALUES (
    auth.uid(),
    p_action,
    p_resource_type,
    p_resource_id,
    p_brand_id,
    p_center_id,
    coalesce(p_payload, '{}'::jsonb),
    auth.uid()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.log_platform_audit(text, text, uuid, uuid, uuid, jsonb) FROM PUBLIC;

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

  PERFORM public.log_platform_audit(
    'approve',
    'platform_brand_signup',
    p_signup_id,
    v_brand_id,
    NULL,
    jsonb_build_object('slug', v_slug, 'requested_name', v_signup.requested_name, 'email', v_signup.email)
  );

  RETURN v_brand_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_platform_brand_signup(
  p_signup_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_signup public.platform_brand_signups%ROWTYPE;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'platform_admin required';
  END IF;

  SELECT * INTO v_signup FROM public.platform_brand_signups WHERE id = p_signup_id FOR UPDATE;
  IF v_signup.id IS NULL OR v_signup.status != 'pending' THEN
    RAISE EXCEPTION 'Signup not found or not pending';
  END IF;

  UPDATE public.platform_brand_signups
  SET
    status = 'rejected',
    message = coalesce(nullif(trim(p_reason), ''), message),
    updated_at = now()
  WHERE id = p_signup_id;

  PERFORM public.log_platform_audit(
    'reject',
    'platform_brand_signup',
    p_signup_id,
    NULL,
    NULL,
    jsonb_build_object(
      'requested_name', v_signup.requested_name,
      'email', v_signup.email,
      'reason', nullif(trim(p_reason), '')
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.approve_platform_brand_signup(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_platform_brand_signup(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.reject_platform_brand_signup(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reject_platform_brand_signup(uuid, text) TO authenticated;
