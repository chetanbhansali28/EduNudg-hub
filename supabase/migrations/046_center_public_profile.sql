-- Center public profile fields editable by franchise staff (settings + public site).

ALTER TABLE public.franchise_centers
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS social_links jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.franchise_centers
  DROP CONSTRAINT IF EXISTS franchise_centers_social_links_array;

ALTER TABLE public.franchise_centers
  ADD CONSTRAINT franchise_centers_social_links_array
  CHECK (jsonb_typeof(social_links) = 'array');

COMMENT ON COLUMN public.franchise_centers.photo_url IS
  'Public center photo in brand-assets: {brand_id}/centers/{center_id}/photo.{ext}';
COMMENT ON COLUMN public.franchise_centers.social_links IS
  'JSON array of {platform, url} for public footer/blurb.';

CREATE OR REPLACE FUNCTION public.update_center_public_profile_rpc(
  p_center_id uuid,
  p_payload jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_id uuid;
  v_social jsonb;
BEGIN
  IF p_center_id IS NULL THEN
    RAISE EXCEPTION 'center_id is required';
  END IF;

  SELECT brand_id INTO v_brand_id
  FROM public.franchise_centers
  WHERE id = p_center_id AND deleted_at IS NULL;

  IF v_brand_id IS NULL THEN
    RAISE EXCEPTION 'Center not found';
  END IF;

  IF NOT public.has_center_access(p_center_id)
     AND NOT public.has_brand_access(v_brand_id)
     AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  v_social := COALESCE(p_payload -> 'social_links', '[]'::jsonb);
  IF jsonb_typeof(v_social) <> 'array' OR jsonb_array_length(v_social) > 6 THEN
    RAISE EXCEPTION 'social_links must be a JSON array with at most 6 entries';
  END IF;

  UPDATE public.franchise_centers
  SET
    display_name = nullif(trim(p_payload ->> 'display_name'), ''),
    short_description = nullif(trim(p_payload ->> 'short_description'), ''),
    address_line1 = nullif(trim(p_payload ->> 'address_line1'), ''),
    city = nullif(trim(p_payload ->> 'city'), ''),
    region = nullif(trim(p_payload ->> 'region'), ''),
    pincode = nullif(trim(p_payload ->> 'pincode'), ''),
    country = coalesce(nullif(trim(p_payload ->> 'country'), ''), country, 'IN'),
    contact_phone = nullif(trim(p_payload ->> 'contact_phone'), ''),
    photo_url = nullif(trim(p_payload ->> 'photo_url'), ''),
    social_links = v_social,
    updated_at = now()
  WHERE id = p_center_id;
END;
$$;

REVOKE ALL ON FUNCTION public.update_center_public_profile_rpc(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_center_public_profile_rpc(uuid, jsonb) TO authenticated;

-- Extend public landing payload with new center profile fields.
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
      'marketing_theme', b.marketing_theme,
      'public_stats', public.brand_public_stats_json(b.id),
      'center_id', c.id,
      'center_slug', c.slug,
      'center_name', c.name,
      'center_display_name', c.display_name,
      'center_city', c.city,
      'center_region', c.region,
      'center_pincode', c.pincode,
      'center_address_line1', c.address_line1,
      'center_contact_phone', c.contact_phone,
      'center_photo_url', c.photo_url,
      'center_short_description', c.short_description,
      'center_social_links', COALESCE(c.social_links, '[]'::jsonb),
      'landing', COALESCE(bs.settings -> 'center_landing', bs.settings -> 'landing', '{}'::jsonb),
      'success_stories', COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'quote', s.quote,
              'author', trim(
                s.author_name || coalesce(' · ' || nullif(trim(s.author_role), ''), '')
              ),
              'rating', s.rating,
              'title', s.title
            )
            ORDER BY s.sort_order ASC, s.created_at DESC
          )
          FROM public.brand_success_stories s
          WHERE s.brand_id = b.id
            AND s.is_published = true
        ),
        '[]'::jsonb
      ),
      'curriculum', public.brand_public_curriculum_json(b.id)
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
