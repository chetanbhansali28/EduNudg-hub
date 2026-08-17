-- list_center_active_merchandise_catalog RETURN QUERY failed: catalog.price_cents is bigint,
-- but the 085 signature used integer (structure does not match / 400 on Inventory + Shop).

DROP FUNCTION IF EXISTS public.list_center_active_merchandise_catalog(uuid);

CREATE FUNCTION public.list_center_active_merchandise_catalog(p_center_id uuid)
RETURNS TABLE (
  id uuid,
  sku text,
  name text,
  price_cents bigint,
  currency text,
  photo_urls text[]
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_center_access(p_center_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    mc.id,
    mc.sku,
    mc.name,
    mc.price_cents,
    mc.currency,
    mc.photo_urls
  FROM public.merchandise_catalog mc
  JOIN public.franchise_centers fc
    ON fc.id = p_center_id
   AND fc.brand_id = mc.brand_id
   AND fc.deleted_at IS NULL
  WHERE mc.is_active = true
    AND public.center_can_order_catalog_item(p_center_id, mc.id)
  ORDER BY mc.name;
END;
$$;

COMMENT ON FUNCTION public.list_center_active_merchandise_catalog(uuid) IS
  'Active SKUs the franchise may order: tied to a course in center_program_enablement.';

REVOKE ALL ON FUNCTION public.list_center_active_merchandise_catalog(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_center_active_merchandise_catalog(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
