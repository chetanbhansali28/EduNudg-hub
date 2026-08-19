-- EduLearn marketing theme (green / orange public layout).

ALTER TABLE public.brands
  DROP CONSTRAINT IF EXISTS brands_marketing_theme_check;

ALTER TABLE public.brands
  ADD CONSTRAINT brands_marketing_theme_check
  CHECK (marketing_theme IN ('novu', 'abacus-classic', 'spark-academy', 'edu-learn'));

CREATE OR REPLACE FUNCTION public.set_brand_marketing_theme(
  p_brand_id uuid,
  p_theme text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Only platform admins can change marketing themes';
  END IF;

  IF p_theme IS NULL OR p_theme NOT IN ('novu', 'abacus-classic', 'spark-academy', 'edu-learn') THEN
    RAISE EXCEPTION 'Invalid marketing theme: %', coalesce(p_theme, 'null');
  END IF;

  UPDATE public.brands
  SET
    marketing_theme = p_theme,
    updated_at = now(),
    updated_by = auth.uid()
  WHERE id = p_brand_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Brand not found';
  END IF;

  RETURN p_theme;
END;
$$;

REVOKE ALL ON FUNCTION public.set_brand_marketing_theme(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_brand_marketing_theme(uuid, text) TO authenticated;
