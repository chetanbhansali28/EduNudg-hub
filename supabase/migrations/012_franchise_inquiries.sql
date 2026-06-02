-- Prospective franchisee inquiries (brand-scoped, public submit via RPC)

CREATE TABLE public.franchise_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone_e164 text,
  city text,
  message text,
  status public.lead_status NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_franchise_inquiries_brand_status ON public.franchise_inquiries (brand_id, status);

CREATE TRIGGER franchise_inquiries_audit
  BEFORE INSERT OR UPDATE ON public.franchise_inquiries
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

ALTER TABLE public.franchise_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY franchise_inquiries_brand_read ON public.franchise_inquiries
  FOR SELECT TO authenticated
  USING (public.has_brand_access(brand_id) OR public.is_platform_admin());

CREATE POLICY franchise_inquiries_platform_all ON public.franchise_inquiries
  FOR ALL TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE OR REPLACE FUNCTION public.get_brand_landing_public(p_brand_slug text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_build_object(
      'brand_id', b.id,
      'brand_slug', b.slug,
      'brand_name', b.name,
      'brand_logo_url', b.logo_url,
      'landing', COALESCE(bs.settings -> 'landing', '{}'::jsonb)
    ),
    '{}'::jsonb
  )
  FROM public.brands b
  LEFT JOIN public.brand_settings bs ON bs.brand_id = b.id
  WHERE p_brand_slug IS NOT NULL
    AND b.slug = p_brand_slug
    AND b.deleted_at IS NULL
    AND b.status = 'active'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.submit_franchise_inquiry(
  p_brand_slug text,
  p_full_name text,
  p_email text,
  p_phone_e164 text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_message text DEFAULT NULL
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
  IF p_brand_slug IS NULL OR trim(p_full_name) = '' OR trim(p_email) = '' THEN
    RAISE EXCEPTION 'brand_slug, full_name, and email are required';
  END IF;

  SELECT b.id INTO v_brand_id
  FROM public.brands b
  WHERE b.slug = p_brand_slug
    AND b.deleted_at IS NULL
    AND b.status = 'active'
  LIMIT 1;

  IF v_brand_id IS NULL THEN
    RAISE EXCEPTION 'Brand not found';
  END IF;

  INSERT INTO public.franchise_inquiries (
    brand_id,
    full_name,
    email,
    phone_e164,
    city,
    message,
    status
  )
  VALUES (
    v_brand_id,
    trim(p_full_name),
    trim(lower(p_email)),
    NULLIF(trim(p_phone_e164), ''),
    NULLIF(trim(p_city), ''),
    NULLIF(trim(p_message), ''),
    'new'
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_brand_landing_public(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_brand_landing_public(text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.submit_franchise_inquiry(text, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_franchise_inquiry(text, text, text, text, text, text) TO anon, authenticated;
