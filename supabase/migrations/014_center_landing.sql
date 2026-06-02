-- Center public landing + parent enrollment leads (website)

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS child_name text,
  ADD COLUMN IF NOT EXISTS child_age_years smallint,
  ADD COLUMN IF NOT EXISTS notes text;

CREATE OR REPLACE FUNCTION public.get_center_landing_public(
  p_brand_slug text,
  p_center_slug text
)
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
      'center_id', c.id,
      'center_slug', c.slug,
      'center_name', c.name,
      'center_city', c.city,
      'landing', COALESCE(bs.settings -> 'landing', '{}'::jsonb)
    ),
    '{}'::jsonb
  )
  FROM public.franchise_centers c
  JOIN public.brands b ON b.id = c.brand_id
  LEFT JOIN public.brand_settings bs ON bs.brand_id = b.id
  WHERE p_brand_slug IS NOT NULL
    AND p_center_slug IS NOT NULL
    AND b.slug = p_brand_slug
    AND c.slug = p_center_slug
    AND b.deleted_at IS NULL
    AND b.status = 'active'
    AND c.deleted_at IS NULL
    AND c.status = 'active'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.submit_center_enrollment_lead(
  p_brand_slug text,
  p_center_slug text,
  p_parent_name text,
  p_email text,
  p_phone_e164 text DEFAULT NULL,
  p_child_name text DEFAULT NULL,
  p_child_age_years smallint DEFAULT NULL,
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
  v_id uuid;
BEGIN
  IF p_brand_slug IS NULL
    OR p_center_slug IS NULL
    OR trim(p_parent_name) = ''
    OR trim(p_email) = ''
  THEN
    RAISE EXCEPTION 'brand_slug, center_slug, parent_name, and email are required';
  END IF;

  SELECT b.id, c.id INTO v_brand_id, v_center_id
  FROM public.franchise_centers c
  JOIN public.brands b ON b.id = c.brand_id
  WHERE b.slug = p_brand_slug
    AND c.slug = p_center_slug
    AND b.deleted_at IS NULL
    AND b.status = 'active'
    AND c.deleted_at IS NULL
    AND c.status = 'active'
  LIMIT 1;

  IF v_center_id IS NULL THEN
    RAISE EXCEPTION 'Center not found';
  END IF;

  INSERT INTO public.leads (
    brand_id,
    center_id,
    full_name,
    email,
    phone_e164,
    child_name,
    child_age_years,
    notes,
    source,
    status
  )
  VALUES (
    v_brand_id,
    v_center_id,
    trim(p_parent_name),
    trim(lower(p_email)),
    NULLIF(trim(p_phone_e164), ''),
    NULLIF(trim(p_child_name), ''),
    p_child_age_years,
    NULLIF(trim(p_notes), ''),
    'website',
    'new'
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_center_landing_public(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_center_landing_public(text, text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.submit_center_enrollment_lead(text, text, text, text, text, text, smallint, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_center_enrollment_lead(text, text, text, text, text, text, smallint, text) TO anon, authenticated;
