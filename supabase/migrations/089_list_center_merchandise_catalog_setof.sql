-- Return catalog rows using the table type so RETURN QUERY cannot mismatch
-- integer vs bigint (085/088) or other column types. PostgREST 400 on Shop/Inventory.

DROP FUNCTION IF EXISTS public.list_center_active_merchandise_catalog(uuid);

CREATE FUNCTION public.list_center_active_merchandise_catalog(p_center_id uuid)
RETURNS SETOF public.merchandise_catalog
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT mc.*
  FROM public.merchandise_catalog mc
  JOIN public.franchise_centers fc
    ON fc.id = p_center_id
   AND fc.brand_id = mc.brand_id
   AND fc.deleted_at IS NULL
  WHERE (public.has_center_access(p_center_id) OR public.is_platform_admin())
    AND mc.is_active = true
    AND public.center_can_order_catalog_item(p_center_id, mc.id)
  ORDER BY mc.name;
$$;

COMMENT ON FUNCTION public.list_center_active_merchandise_catalog(uuid) IS
  'Active SKUs the franchise may order: tied to a course in center_program_enablement.';

REVOKE ALL ON FUNCTION public.list_center_active_merchandise_catalog(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_center_active_merchandise_catalog(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
