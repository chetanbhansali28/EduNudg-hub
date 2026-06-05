-- RLS helper functions (after memberships exist)

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND m.scope_type = 'platform'
      AND m.status = 'active'
      AND m.role_key IN ('platform_super_admin', 'platform_ops')
  );
$$;

CREATE OR REPLACE FUNCTION public.user_brand_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT m.brand_id FROM public.memberships m
  WHERE m.user_id = auth.uid()
    AND m.status = 'active'
    AND m.brand_id IS NOT NULL
  UNION
  SELECT b.id FROM public.brands b WHERE public.is_platform_admin();
$$;

CREATE OR REPLACE FUNCTION public.user_center_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT m.center_id FROM public.memberships m
  WHERE m.user_id = auth.uid()
    AND m.status = 'active'
    AND m.center_id IS NOT NULL
  UNION
  SELECT fc.id FROM public.franchise_centers fc
  WHERE fc.brand_id IN (SELECT public.user_brand_ids())
    AND EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.scope_type = 'brand'
        AND m.brand_id = fc.brand_id
        AND m.status = 'active'
        AND m.role_key IN ('brand_owner', 'brand_admin')
    );
$$;

CREATE OR REPLACE FUNCTION public.has_brand_access(p_brand_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_platform_admin()
    OR p_brand_id IN (SELECT public.user_brand_ids());
$$;

CREATE OR REPLACE FUNCTION public.has_center_access(p_center_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_platform_admin()
    OR p_center_id IN (SELECT public.user_center_ids())
    OR EXISTS (
      SELECT 1 FROM public.franchise_centers fc
      WHERE fc.id = p_center_id
        AND public.has_brand_access(fc.brand_id)
    );
$$;

-- Brand policies
CREATE POLICY brands_platform_all ON public.brands FOR ALL TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE POLICY brands_select ON public.brands FOR SELECT TO authenticated
  USING (public.has_brand_access(id));

CREATE POLICY brands_update ON public.brands FOR UPDATE TO authenticated
  USING (public.has_brand_access(id))
  WITH CHECK (public.has_brand_access(id));

CREATE POLICY centers_select ON public.franchise_centers FOR SELECT TO authenticated
  USING (public.has_center_access(id) OR public.has_brand_access(brand_id));

CREATE POLICY centers_mutate ON public.franchise_centers FOR ALL TO authenticated
  USING (public.has_brand_access(brand_id))
  WITH CHECK (public.has_brand_access(brand_id));

CREATE POLICY memberships_select ON public.memberships FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_platform_admin()
    OR (brand_id IS NOT NULL AND public.has_brand_access(brand_id))
  );

CREATE POLICY memberships_platform ON public.memberships FOR ALL TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

REVOKE ALL ON FUNCTION public.is_platform_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_brand_access(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_center_access(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_brand_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_center_access(uuid) TO authenticated;
