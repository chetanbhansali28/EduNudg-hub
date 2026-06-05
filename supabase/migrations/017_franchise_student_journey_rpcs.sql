-- RPCs for franchise & student journey

-- ---------------------------------------------------------------------------
-- upsert_lead_by_whatsapp (internal pattern, exposed via submit RPCs)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.upsert_lead_by_whatsapp(
  p_brand_id uuid,
  p_whatsapp text,
  p_payload jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wa text;
  v_id uuid;
  v_existing public.leads%ROWTYPE;
  v_lead_source text;
  v_center_id uuid;
BEGIN
  v_wa := public.normalize_phone_e164(p_whatsapp);
  IF v_wa IS NULL THEN
    RAISE EXCEPTION 'whatsapp_e164 is required';
  END IF;

  v_lead_source := coalesce(p_payload ->> 'lead_source', 'brand');
  v_center_id := (p_payload ->> 'center_id')::uuid;

  SELECT * INTO v_existing
  FROM public.leads l
  WHERE l.brand_id = p_brand_id AND l.whatsapp_e164 = v_wa
  ORDER BY l.created_at DESC
  LIMIT 1;

  IF v_existing.id IS NOT NULL THEN
    UPDATE public.leads SET
      full_name = coalesce(nullif(trim(p_payload ->> 'parent_name'), ''), full_name),
      parent_name = coalesce(nullif(trim(p_payload ->> 'parent_name'), ''), parent_name),
      email = coalesce(nullif(trim(lower(p_payload ->> 'email')), ''), email),
      phone_e164 = coalesce(v_wa, phone_e164),
      child_name = coalesce(nullif(trim(p_payload ->> 'child_name'), ''), child_name),
      child_dob = coalesce((p_payload ->> 'child_dob')::date, child_dob),
      pincode = coalesce(nullif(trim(p_payload ->> 'pincode'), ''), pincode),
      city = coalesce(nullif(trim(p_payload ->> 'city'), ''), city),
      school_name = coalesce(nullif(trim(p_payload ->> 'school_name'), ''), school_name),
      notes = coalesce(nullif(trim(p_payload ->> 'notes'), ''), notes),
      center_id = CASE
        WHEN v_lead_source = 'center' AND v_center_id IS NOT NULL THEN v_center_id
        ELSE center_id
      END,
      lead_source = CASE
        WHEN v_lead_source = 'center' THEN 'center'
        ELSE lead_source
      END,
      status = CASE
        WHEN v_existing.status = 'lost' THEN 'new'
        ELSE status
      END,
      lost_reason = CASE
        WHEN v_existing.status = 'lost' THEN NULL
        ELSE lost_reason
      END,
      updated_at = now()
    WHERE id = v_existing.id;

    INSERT INTO public.lead_events (lead_id, brand_id, event_type, payload, created_by)
    VALUES (
      v_existing.id,
      p_brand_id,
      CASE WHEN v_existing.status = 'lost' THEN 'reopened_merge' ELSE 'merged' END,
      p_payload,
      auth.uid()
    );

    RETURN v_existing.id;
  END IF;

  INSERT INTO public.leads (
    brand_id, center_id, full_name, parent_name, email, phone_e164, whatsapp_e164,
    child_name, child_dob, pincode, city, school_name, notes, lead_source, source, status
  )
  VALUES (
    p_brand_id,
    CASE WHEN v_lead_source = 'center' THEN v_center_id ELSE NULL END,
    coalesce(nullif(trim(p_payload ->> 'parent_name'), ''), 'Parent'),
    nullif(trim(p_payload ->> 'parent_name'), ''),
    nullif(trim(lower(p_payload ->> 'email')), ''),
    v_wa,
    v_wa,
    nullif(trim(p_payload ->> 'child_name'), ''),
    (p_payload ->> 'child_dob')::date,
    nullif(trim(p_payload ->> 'pincode'), ''),
    nullif(trim(p_payload ->> 'city'), ''),
    nullif(trim(p_payload ->> 'school_name'), ''),
    nullif(trim(p_payload ->> 'notes'), ''),
    v_lead_source,
    v_lead_source,
    'new'
  )
  RETURNING id INTO v_id;

  INSERT INTO public.lead_events (lead_id, brand_id, event_type, payload, created_by)
  VALUES (v_id, p_brand_id, 'created', p_payload, auth.uid());

  RETURN v_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Public: platform brand signup
-- ---------------------------------------------------------------------------

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

  INSERT INTO public.brand_settings (brand_id, settings)
  VALUES (
    v_brand_id,
    jsonb_build_object(
      'timezone', 'Asia/Kolkata',
      'lead_stale_days', 15,
      'features', jsonb_build_object(
        'student_leads', true,
        'franchise_applications', true,
        'brand_billing', true,
        'kits', false,
        'campaigns', false
      ),
      'integrations', jsonb_build_object('payment_gateway', false, 'auth_google', true)
    )
  );

  INSERT INTO public.domain_mappings (hostname, portal_type, brand_id, is_primary)
  VALUES (v_slug || '.localhost', 'brand', v_brand_id, true);

  SELECT sp.id INTO v_plan_id FROM public.subscription_plans sp WHERE sp.is_active ORDER BY sp.created_at LIMIT 1;
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

-- ---------------------------------------------------------------------------
-- Brand student application & center registration
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.submit_brand_student_application(
  p_brand_slug text,
  p_parent_name text,
  p_whatsapp_e164 text,
  p_email text,
  p_city text,
  p_pincode text,
  p_child_name text DEFAULT NULL,
  p_child_dob date DEFAULT NULL,
  p_school_name text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_id uuid;
  v_payload jsonb;
BEGIN
  SELECT b.id INTO v_brand_id FROM public.brands b
  WHERE b.slug = p_brand_slug AND b.deleted_at IS NULL AND b.status = 'active';

  IF v_brand_id IS NULL THEN
    RAISE EXCEPTION 'Brand not found';
  END IF;

  IF NOT public.brand_feature_enabled(v_brand_id, 'student_leads') THEN
    RAISE EXCEPTION 'feature_disabled';
  END IF;

  IF trim(p_city) = '' OR trim(p_pincode) = '' THEN
    RAISE EXCEPTION 'city and pincode are required';
  END IF;

  v_payload := jsonb_build_object(
    'lead_source', 'brand',
    'parent_name', p_parent_name,
    'email', p_email,
    'whatsapp', p_whatsapp_e164,
    'city', p_city,
    'pincode', p_pincode,
    'child_name', p_child_name,
    'child_dob', p_child_dob,
    'school_name', p_school_name,
    'notes', p_notes
  );

  RETURN public.upsert_lead_by_whatsapp(v_brand_id, p_whatsapp_e164, v_payload);
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_center_student_registration(
  p_brand_slug text,
  p_center_slug text,
  p_parent_name text,
  p_whatsapp_e164 text,
  p_email text,
  p_city text DEFAULT NULL,
  p_pincode text DEFAULT NULL,
  p_child_name text DEFAULT NULL,
  p_child_dob date DEFAULT NULL,
  p_school_name text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_id uuid;
  v_center_id uuid;
  v_payload jsonb;
BEGIN
  SELECT b.id, c.id INTO v_brand_id, v_center_id
  FROM public.franchise_centers c
  JOIN public.brands b ON b.id = c.brand_id
  WHERE b.slug = p_brand_slug AND c.slug = p_center_slug
    AND b.deleted_at IS NULL AND b.status = 'active'
    AND c.deleted_at IS NULL AND c.status = 'active';

  IF v_center_id IS NULL THEN
    RAISE EXCEPTION 'Center not found';
  END IF;

  v_payload := jsonb_build_object(
    'lead_source', 'center',
    'center_id', v_center_id,
    'parent_name', p_parent_name,
    'email', p_email,
    'whatsapp', p_whatsapp_e164,
    'city', p_city,
    'pincode', p_pincode,
    'child_name', p_child_name,
    'child_dob', p_child_dob,
    'school_name', p_school_name,
    'notes', p_notes
  );

  RETURN public.upsert_lead_by_whatsapp(v_brand_id, p_whatsapp_e164, v_payload);
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_franchise_inquiry_v2(
  p_brand_slug text,
  p_full_name text,
  p_email text,
  p_phone_e164 text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_message text DEFAULT NULL,
  p_proposed_franchise_name text DEFAULT NULL,
  p_address_line text DEFAULT NULL,
  p_state text DEFAULT NULL,
  p_pincode text DEFAULT NULL,
  p_prior_experience text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_id uuid;
  v_id uuid;
BEGIN
  SELECT b.id INTO v_brand_id FROM public.brands b
  WHERE b.slug = p_brand_slug AND b.deleted_at IS NULL AND b.status = 'active';

  IF v_brand_id IS NULL THEN
    RAISE EXCEPTION 'Brand not found';
  END IF;

  IF NOT public.brand_feature_enabled(v_brand_id, 'franchise_applications') THEN
    RAISE EXCEPTION 'feature_disabled';
  END IF;

  INSERT INTO public.franchise_inquiries (
    brand_id, full_name, email, phone_e164, city, message,
    proposed_franchise_name, address_line, state, pincode, prior_experience, status
  )
  VALUES (
    v_brand_id, trim(p_full_name), trim(lower(p_email)),
    public.normalize_phone_e164(p_phone_e164),
    nullif(trim(p_city), ''), nullif(trim(p_message), ''),
    nullif(trim(p_proposed_franchise_name), ''),
    nullif(trim(p_address_line), ''),
    nullif(trim(p_state), ''),
    nullif(trim(p_pincode), ''),
    nullif(trim(p_prior_experience), ''),
    'new'
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Lead operations (brand / center)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.suggest_centers_for_lead(p_lead_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead public.leads%ROWTYPE;
  v_pin_last3 int;
  v_exact jsonb := '[]'::jsonb;
  v_near jsonb := '[]'::jsonb;
BEGIN
  SELECT * INTO v_lead FROM public.leads l WHERE l.id = p_lead_id;
  IF v_lead.id IS NULL OR NOT public.has_brand_access(v_lead.brand_id) THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'center_id', c.id, 'name', coalesce(c.display_name, c.name),
    'pincode', c.pincode, 'city', c.city, 'distance_last3', 0
  ) ORDER BY c.name), '[]'::jsonb)
  INTO v_exact
  FROM public.franchise_centers c
  WHERE c.brand_id = v_lead.brand_id AND c.status = 'active' AND c.deleted_at IS NULL
    AND c.pincode IS NOT NULL AND v_lead.pincode IS NOT NULL
    AND c.pincode = v_lead.pincode;

  IF v_lead.pincode ~ '^\d{6}$' THEN
    v_pin_last3 := (v_lead.pincode::int % 1000);
  ELSE
    v_pin_last3 := NULL;
  END IF;

  SELECT coalesce(jsonb_agg(row ORDER BY (row ->> 'distance_last3')::int), '[]'::jsonb)
  INTO v_near
  FROM (
    SELECT jsonb_build_object(
      'center_id', c.id,
      'name', coalesce(c.display_name, c.name),
      'pincode', c.pincode,
      'city', c.city,
      'distance_last3', abs((c.pincode::int % 1000) - coalesce(v_pin_last3, 0))
    ) AS row
    FROM public.franchise_centers c
    WHERE c.brand_id = v_lead.brand_id AND c.status = 'active' AND c.deleted_at IS NULL
      AND c.pincode IS NOT NULL AND c.city IS NOT NULL AND v_lead.city IS NOT NULL
      AND lower(trim(c.city)) = lower(trim(v_lead.city))
      AND left(c.pincode, 3) = left(v_lead.pincode, 3)
      AND (v_exact = '[]'::jsonb OR NOT EXISTS (
        SELECT 1 FROM jsonb_array_elements(v_exact) e WHERE (e ->> 'center_id')::uuid = c.id
      ))
  ) sub;

  RETURN jsonb_build_object('exact', v_exact, 'near', v_near);
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_lead_to_center(p_lead_id uuid, p_center_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead public.leads%ROWTYPE;
BEGIN
  SELECT * INTO v_lead FROM public.leads WHERE id = p_lead_id FOR UPDATE;
  IF v_lead.id IS NULL OR NOT public.has_brand_access(v_lead.brand_id) THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.franchise_centers c
    WHERE c.id = p_center_id AND c.brand_id = v_lead.brand_id AND c.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Invalid center';
  END IF;

  UPDATE public.leads SET
    center_id = p_center_id,
    assigned_at = now(),
    assigned_by = auth.uid(),
    last_center_action_at = NULL,
    stale_at = public.compute_lead_stale_at(v_lead.brand_id, now()),
    status = CASE WHEN status = 'lost' THEN 'new' ELSE status END,
    updated_at = now()
  WHERE id = p_lead_id;

  INSERT INTO public.lead_assignment_history (lead_id, brand_id, from_center_id, to_center_id, assigned_by)
  VALUES (p_lead_id, v_lead.brand_id, v_lead.center_id, p_center_id, auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION public.reassign_lead(p_lead_id uuid, p_center_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead public.leads%ROWTYPE;
BEGIN
  SELECT * INTO v_lead FROM public.leads WHERE id = p_lead_id FOR UPDATE;
  IF v_lead.id IS NULL OR NOT public.has_brand_access(v_lead.brand_id) THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;
  IF v_lead.status = 'converted' THEN
    RAISE EXCEPTION 'Cannot reassign converted lead';
  END IF;

  PERFORM public.assign_lead_to_center(p_lead_id, p_center_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_lead_status(p_lead_id uuid, p_status public.lead_status)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead public.leads%ROWTYPE;
BEGIN
  SELECT * INTO v_lead FROM public.leads WHERE id = p_lead_id FOR UPDATE;
  IF v_lead.id IS NULL THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;
  IF v_lead.center_id IS NULL OR NOT public.has_center_access(v_lead.center_id) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  UPDATE public.leads SET
    status = p_status,
    last_center_action_at = now(),
    updated_at = now()
  WHERE id = p_lead_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_lead_lost(p_lead_id uuid, p_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead public.leads%ROWTYPE;
BEGIN
  IF trim(coalesce(p_reason, '')) = '' THEN
    RAISE EXCEPTION 'lost_reason is required';
  END IF;

  SELECT * INTO v_lead FROM public.leads WHERE id = p_lead_id FOR UPDATE;
  IF v_lead.id IS NULL OR v_lead.center_id IS NULL OR NOT public.has_center_access(v_lead.center_id) THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;

  UPDATE public.leads SET status = 'lost', lost_reason = trim(p_reason), updated_at = now()
  WHERE id = p_lead_id;

  INSERT INTO public.lead_events (lead_id, brand_id, event_type, payload, created_by)
  VALUES (p_lead_id, v_lead.brand_id, 'lost', jsonb_build_object('reason', trim(p_reason)), auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION public.reopen_lead(p_lead_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead public.leads%ROWTYPE;
  v_prev_reason text;
BEGIN
  SELECT * INTO v_lead FROM public.leads WHERE id = p_lead_id FOR UPDATE;
  IF v_lead.id IS NULL OR NOT public.has_brand_access(v_lead.brand_id) THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;
  IF v_lead.status != 'lost' THEN
    RAISE EXCEPTION 'Lead is not lost';
  END IF;

  v_prev_reason := v_lead.lost_reason;

  UPDATE public.leads SET status = 'new', lost_reason = NULL, updated_at = now()
  WHERE id = p_lead_id;

  INSERT INTO public.lead_events (lead_id, brand_id, event_type, payload, created_by)
  VALUES (p_lead_id, v_lead.brand_id, 'reopened', jsonb_build_object('previous_lost_reason', v_prev_reason), auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION public.convert_lead_to_student(p_lead_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead public.leads%ROWTYPE;
  v_parent_id uuid;
  v_student_id uuid;
BEGIN
  SELECT * INTO v_lead FROM public.leads WHERE id = p_lead_id FOR UPDATE;
  IF v_lead.id IS NULL OR v_lead.center_id IS NULL OR NOT public.has_center_access(v_lead.center_id) THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;
  IF v_lead.status = 'converted' THEN
    RAISE EXCEPTION 'Already converted';
  END IF;

  INSERT INTO public.parents (brand_id, full_name, email, phone_e164)
  VALUES (
    v_lead.brand_id,
    coalesce(v_lead.parent_name, v_lead.full_name),
    v_lead.email,
    coalesce(v_lead.whatsapp_e164, v_lead.phone_e164)
  )
  RETURNING id INTO v_parent_id;

  INSERT INTO public.students (brand_id, full_name, date_of_birth, source_lead_id)
  VALUES (
    v_lead.brand_id,
    coalesce(v_lead.child_name, 'Student'),
    v_lead.child_dob,
    v_lead.id
  )
  RETURNING id INTO v_student_id;

  INSERT INTO public.parent_student_links (brand_id, parent_id, student_id)
  VALUES (v_lead.brand_id, v_parent_id, v_student_id);

  INSERT INTO public.student_profiles (brand_id, student_id, school_name, city, pincode)
  VALUES (v_lead.brand_id, v_student_id, v_lead.school_name, v_lead.city, v_lead.pincode);

  INSERT INTO public.student_enrollments (brand_id, center_id, student_id, status)
  VALUES (v_lead.brand_id, v_lead.center_id, v_student_id, 'active');

  UPDATE public.leads SET status = 'converted', updated_at = now() WHERE id = p_lead_id;

  RETURN v_student_id;
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
  IF NOT public.brand_feature_enabled(p_brand_id, 'brand_billing') THEN
    RAISE EXCEPTION 'feature_disabled';
  END IF;
  RETURN jsonb_build_object('status', 'stub', 'message', 'Configure payment gateway integration');
END;
$$;

CREATE OR REPLACE FUNCTION public.record_platform_payment(
  p_invoice_id uuid,
  p_external_reference text,
  p_amount_cents bigint
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'platform_admin required';
  END IF;
  UPDATE public.platform_invoices
  SET status = 'paid', paid_at = now(), updated_at = now()
  WHERE id = p_invoice_id;
END;
$$;

-- Grants: revoke default PUBLIC execute before role-specific grants
REVOKE ALL ON FUNCTION public.upsert_lead_by_whatsapp(uuid, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_lead_by_whatsapp(uuid, text, jsonb) TO authenticated;

REVOKE ALL ON FUNCTION public.submit_platform_brand_signup(text, text, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_platform_brand_signup(text, text, text, text, text, text, text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.approve_platform_brand_signup(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_platform_brand_signup(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.submit_brand_student_application(text, text, text, text, text, text, text, date, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_brand_student_application(text, text, text, text, text, text, text, date, text, text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.submit_center_student_registration(text, text, text, text, text, text, text, text, date, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_center_student_registration(text, text, text, text, text, text, text, text, date, text, text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.submit_franchise_inquiry_v2(text, text, text, text, text, text, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_franchise_inquiry_v2(text, text, text, text, text, text, text, text, text, text, text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.suggest_centers_for_lead(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.suggest_centers_for_lead(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.assign_lead_to_center(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_lead_to_center(uuid, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.reassign_lead(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reassign_lead(uuid, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.update_lead_status(uuid, public.lead_status) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_lead_status(uuid, public.lead_status) TO authenticated;

REVOKE ALL ON FUNCTION public.mark_lead_lost(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_lead_lost(uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION public.reopen_lead(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reopen_lead(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.convert_lead_to_student(uuid) FROM PUBLIC, anon;

REVOKE ALL ON FUNCTION public.create_brand_subscription_checkout(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_brand_subscription_checkout(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.record_platform_payment(uuid, text, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_platform_payment(uuid, text, bigint) TO authenticated;
