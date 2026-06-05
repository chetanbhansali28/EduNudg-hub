-- Journey completion: reject signup, convert overrides, status guards, kit order line RLS

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
END;
$$;

REVOKE ALL ON FUNCTION public.reject_platform_brand_signup(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reject_platform_brand_signup(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.update_lead_status(p_lead_id uuid, p_status public.lead_status)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead public.leads%ROWTYPE;
BEGIN
  IF p_status IN ('lost', 'converted') THEN
    RAISE EXCEPTION 'Use mark_lead_lost or convert_lead_to_student for terminal statuses';
  END IF;

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

CREATE OR REPLACE FUNCTION public.convert_lead_to_student(
  p_lead_id uuid,
  p_overrides jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead public.leads%ROWTYPE;
  v_parent_id uuid;
  v_student_id uuid;
  v_parent_name text;
  v_child_name text;
  v_school_name text;
  v_city text;
  v_pincode text;
BEGIN
  SELECT * INTO v_lead FROM public.leads WHERE id = p_lead_id FOR UPDATE;
  IF v_lead.id IS NULL OR v_lead.center_id IS NULL OR NOT public.has_center_access(v_lead.center_id) THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;
  IF v_lead.status = 'converted' THEN
    RAISE EXCEPTION 'Already converted';
  END IF;

  v_parent_name := coalesce(
    nullif(trim(p_overrides ->> 'parent_name'), ''),
    coalesce(v_lead.parent_name, v_lead.full_name)
  );
  v_child_name := coalesce(nullif(trim(p_overrides ->> 'child_name'), ''), coalesce(v_lead.child_name, 'Student'));
  v_school_name := coalesce(nullif(trim(p_overrides ->> 'school_name'), ''), v_lead.school_name);
  v_city := coalesce(nullif(trim(p_overrides ->> 'city'), ''), v_lead.city);
  v_pincode := coalesce(nullif(trim(p_overrides ->> 'pincode'), ''), v_lead.pincode);

  INSERT INTO public.parents (brand_id, full_name, email, phone_e164)
  VALUES (
    v_lead.brand_id,
    v_parent_name,
    v_lead.email,
    coalesce(v_lead.whatsapp_e164, v_lead.phone_e164)
  )
  RETURNING id INTO v_parent_id;

  INSERT INTO public.students (brand_id, full_name, date_of_birth, source_lead_id)
  VALUES (
    v_lead.brand_id,
    v_child_name,
    coalesce((p_overrides ->> 'child_dob')::date, v_lead.child_dob),
    v_lead.id
  )
  RETURNING id INTO v_student_id;

  INSERT INTO public.parent_student_links (brand_id, parent_id, student_id)
  VALUES (v_lead.brand_id, v_parent_id, v_student_id);

  INSERT INTO public.student_profiles (brand_id, student_id, school_name, city, pincode)
  VALUES (v_lead.brand_id, v_student_id, v_school_name, v_city, v_pincode);

  INSERT INTO public.student_enrollments (brand_id, center_id, student_id, status)
  VALUES (v_lead.brand_id, v_lead.center_id, v_student_id, 'active');

  UPDATE public.leads SET status = 'converted', updated_at = now() WHERE id = p_lead_id;

  RETURN v_student_id;
END;
$$;

REVOKE ALL ON FUNCTION public.convert_lead_to_student(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.convert_lead_to_student(uuid, jsonb) TO authenticated;

REVOKE ALL ON FUNCTION public.update_lead_status(uuid, public.lead_status) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_lead_status(uuid, public.lead_status) TO authenticated;

DROP POLICY IF EXISTS kit_order_lines_access ON public.kit_order_lines;
CREATE POLICY kit_order_lines_access ON public.kit_order_lines FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.kit_orders o
      WHERE o.id = kit_order_lines.order_id
        AND (
          public.has_center_access(o.center_id)
          OR public.has_brand_access(o.brand_id)
          OR public.is_platform_admin()
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.kit_orders o
      WHERE o.id = kit_order_lines.order_id
        AND (
          public.has_center_access(o.center_id)
          OR public.has_brand_access(o.brand_id)
          OR public.is_platform_admin()
        )
    )
  );

DROP POLICY IF EXISTS student_kit_allocations_access ON public.student_kit_allocations;
CREATE POLICY student_kit_allocations_access ON public.student_kit_allocations FOR ALL TO authenticated
  USING (
    public.has_center_access(center_id)
    OR public.has_brand_access(brand_id)
    OR public.is_platform_admin()
  )
  WITH CHECK (
    public.has_center_access(center_id)
    OR public.has_brand_access(brand_id)
    OR public.is_platform_admin()
  );
