-- Manual leads (staff), curriculum abacus fields, brand success stories

-- ---------------------------------------------------------------------------
-- Curriculum: abacus program metadata
-- ---------------------------------------------------------------------------

ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS why_take text,
  ADD COLUMN IF NOT EXISTS what_you_learn text,
  ADD COLUMN IF NOT EXISTS marketing_video_url text;

ALTER TABLE public.levels
  ADD COLUMN IF NOT EXISTS abacus_level_code text,
  ADD COLUMN IF NOT EXISTS topics_covered jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS why_take text,
  ADD COLUMN IF NOT EXISTS what_you_learn text,
  ADD COLUMN IF NOT EXISTS marketing_video_url text;

-- ---------------------------------------------------------------------------
-- Brand success stories (CRUD in brand portal; optional sync to marketing later)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.brand_success_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  title text NOT NULL,
  quote text NOT NULL,
  author_name text NOT NULL,
  author_role text,
  rating smallint CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  image_url text,
  sort_order int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_brand_success_stories_brand ON public.brand_success_stories (brand_id, sort_order);

DROP TRIGGER IF EXISTS brand_success_stories_audit ON public.brand_success_stories;
CREATE TRIGGER brand_success_stories_audit
  BEFORE INSERT OR UPDATE ON public.brand_success_stories
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

ALTER TABLE public.brand_success_stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS brand_success_stories_brand ON public.brand_success_stories;
CREATE POLICY brand_success_stories_brand ON public.brand_success_stories FOR ALL TO authenticated
  USING (public.has_brand_access(brand_id))
  WITH CHECK (public.has_brand_access(brand_id));

-- ---------------------------------------------------------------------------
-- Staff manual lead / signup RPCs
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_platform_brand_signup_staff(
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
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'platform_admin required';
  END IF;
  IF trim(coalesce(p_requested_name, '')) = '' OR trim(coalesce(p_admin_full_name, '')) = ''
     OR trim(coalesce(p_email, '')) = '' OR trim(coalesce(p_city, '')) = '' THEN
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
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_franchise_inquiry_staff(
  p_brand_id uuid,
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
  v_id uuid;
BEGIN
  IF NOT public.has_brand_access(p_brand_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF trim(coalesce(p_full_name, '')) = '' OR trim(coalesce(p_email, '')) = '' THEN
    RAISE EXCEPTION 'full_name and email are required';
  END IF;

  INSERT INTO public.franchise_inquiries (
    brand_id, full_name, email, phone_e164, city, message,
    proposed_franchise_name, address_line, state, pincode, prior_experience, status
  )
  VALUES (
    p_brand_id,
    trim(p_full_name),
    trim(lower(p_email)),
    public.normalize_phone_e164(p_phone_e164),
    nullif(trim(p_city), ''),
    nullif(trim(p_message), ''),
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

CREATE OR REPLACE FUNCTION public.create_brand_student_lead_staff(
  p_brand_id uuid,
  p_parent_name text,
  p_whatsapp_e164 text,
  p_email text DEFAULT NULL,
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
  v_id uuid;
  v_payload jsonb;
BEGIN
  IF NOT public.has_brand_access(p_brand_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF trim(coalesce(p_parent_name, '')) = '' OR trim(coalesce(p_whatsapp_e164, '')) = '' THEN
    RAISE EXCEPTION 'parent_name and whatsapp are required';
  END IF;

  v_payload := jsonb_build_object(
    'lead_source', 'brand',
    'parent_name', trim(p_parent_name),
    'email', nullif(trim(lower(coalesce(p_email, ''))), ''),
    'whatsapp_e164', p_whatsapp_e164,
    'city', nullif(trim(coalesce(p_city, '')), ''),
    'pincode', nullif(trim(coalesce(p_pincode, '')), ''),
    'child_name', nullif(trim(coalesce(p_child_name, '')), ''),
    'child_dob', p_child_dob,
    'school_name', nullif(trim(coalesce(p_school_name, '')), ''),
    'notes', coalesce(nullif(trim(coalesce(p_notes, '')), ''), 'Manual entry by brand staff')
  );

  v_id := public.upsert_lead_by_whatsapp(p_brand_id, p_whatsapp_e164, v_payload);

  INSERT INTO public.lead_events (lead_id, brand_id, event_type, payload, created_by)
  VALUES (v_id, p_brand_id, 'manual_created', jsonb_build_object('scope', 'brand'), auth.uid());

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_center_student_lead_staff(
  p_center_id uuid,
  p_parent_name text,
  p_whatsapp_e164 text,
  p_email text DEFAULT NULL,
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
  v_id uuid;
  v_brand_id uuid;
  v_payload jsonb;
BEGIN
  IF NOT public.has_center_access(p_center_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT fc.brand_id INTO v_brand_id
  FROM public.franchise_centers fc
  WHERE fc.id = p_center_id AND fc.deleted_at IS NULL;

  IF v_brand_id IS NULL THEN
    RAISE EXCEPTION 'Center not found';
  END IF;

  IF trim(coalesce(p_parent_name, '')) = '' OR trim(coalesce(p_whatsapp_e164, '')) = '' THEN
    RAISE EXCEPTION 'parent_name and whatsapp are required';
  END IF;

  v_payload := jsonb_build_object(
    'lead_source', 'center',
    'center_id', p_center_id,
    'parent_name', trim(p_parent_name),
    'email', nullif(trim(lower(coalesce(p_email, ''))), ''),
    'whatsapp_e164', p_whatsapp_e164,
    'city', nullif(trim(coalesce(p_city, '')), ''),
    'pincode', nullif(trim(coalesce(p_pincode, '')), ''),
    'child_name', nullif(trim(coalesce(p_child_name, '')), ''),
    'child_dob', p_child_dob,
    'school_name', nullif(trim(coalesce(p_school_name, '')), ''),
    'notes', coalesce(nullif(trim(coalesce(p_notes, '')), ''), 'Manual entry by center staff')
  );

  v_id := public.upsert_lead_by_whatsapp(v_brand_id, p_whatsapp_e164, v_payload);

  INSERT INTO public.lead_events (lead_id, brand_id, event_type, payload, created_by)
  VALUES (v_id, v_brand_id, 'manual_created', jsonb_build_object('scope', 'center', 'center_id', p_center_id), auth.uid());

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_platform_brand_signup_staff(text, text, text, text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_franchise_inquiry_staff(uuid, text, text, text, text, text, text, text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_brand_student_lead_staff(uuid, text, text, text, text, text, text, date, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_center_student_lead_staff(uuid, text, text, text, text, text, text, date, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_platform_brand_signup_staff(text, text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_franchise_inquiry_staff(uuid, text, text, text, text, text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_brand_student_lead_staff(uuid, text, text, text, text, text, text, date, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_center_student_lead_staff(uuid, text, text, text, text, text, text, date, text, text) TO authenticated;
