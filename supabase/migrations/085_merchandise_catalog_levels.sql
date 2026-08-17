-- Program + level tagging on merchandise SKUs.
-- Franchise shop/inventory still match assigned programs; level is the finer brand tag.

ALTER TABLE public.merchandise_catalog_programs
  ADD COLUMN IF NOT EXISTS level_id uuid REFERENCES public.levels(id) ON DELETE CASCADE;

ALTER TABLE public.merchandise_catalog_programs
  DROP CONSTRAINT IF EXISTS merchandise_catalog_programs_catalog_item_id_program_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS merchandise_catalog_programs_program_only_uidx
  ON public.merchandise_catalog_programs (catalog_item_id, program_id)
  WHERE level_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS merchandise_catalog_programs_program_level_uidx
  ON public.merchandise_catalog_programs (catalog_item_id, program_id, level_id)
  WHERE level_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_merchandise_catalog_programs_level
  ON public.merchandise_catalog_programs (level_id)
  WHERE level_id IS NOT NULL;

COMMENT ON TABLE public.merchandise_catalog_programs IS
  'SKU-to-curriculum links (program + optional level). Franchise shop uses list_center_active_merchandise_catalog.';

DROP FUNCTION IF EXISTS public.sync_merchandise_catalog_programs(uuid, uuid, uuid[]);

CREATE OR REPLACE FUNCTION public.sync_merchandise_catalog_programs(
  p_brand_id uuid,
  p_catalog_item_id uuid,
  p_links jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link jsonb;
  v_program_id uuid;
  v_level_id uuid;
BEGIN
  IF NOT public.has_brand_access(p_brand_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF NOT public.brand_feature_enabled(p_brand_id, 'merchandise') THEN
    RAISE EXCEPTION 'feature_disabled';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.merchandise_catalog mc
    WHERE mc.id = p_catalog_item_id AND mc.brand_id = p_brand_id
  ) THEN
    RAISE EXCEPTION 'Item not found';
  END IF;

  IF p_links IS NOT NULL AND jsonb_typeof(p_links) <> 'array' THEN
    RAISE EXCEPTION 'Invalid curriculum';
  END IF;

  FOR v_link IN
    SELECT elem
    FROM jsonb_array_elements(coalesce(p_links, '[]'::jsonb)) AS elem
  LOOP
    v_program_id := nullif(v_link ->> 'program_id', '')::uuid;
    v_level_id := nullif(v_link ->> 'level_id', '')::uuid;
    IF v_program_id IS NULL THEN
      RAISE EXCEPTION 'Invalid curriculum';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.id = v_program_id AND p.brand_id = p_brand_id AND p.deleted_at IS NULL
    ) THEN
      RAISE EXCEPTION 'Invalid curriculum';
    END IF;
    IF v_level_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.levels l
      WHERE l.id = v_level_id AND l.program_id = v_program_id AND l.brand_id = p_brand_id
    ) THEN
      RAISE EXCEPTION 'Invalid curriculum level';
    END IF;
  END LOOP;

  DELETE FROM public.merchandise_catalog_programs mcp
  WHERE mcp.catalog_item_id = p_catalog_item_id
    AND mcp.brand_id = p_brand_id;

  INSERT INTO public.merchandise_catalog_programs (brand_id, catalog_item_id, program_id, level_id)
  SELECT DISTINCT
    p_brand_id,
    p_catalog_item_id,
    nullif(v_link ->> 'program_id', '')::uuid,
    nullif(v_link ->> 'level_id', '')::uuid
  FROM jsonb_array_elements(coalesce(p_links, '[]'::jsonb)) AS v_link
  WHERE nullif(v_link ->> 'program_id', '') IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_merchandise_catalog_programs(uuid, uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_merchandise_catalog_programs(uuid, uuid, jsonb) TO authenticated;

-- Brand FOR ALL on merchandise_catalog would otherwise leak every SKU to a brand
-- owner on the franchise host. This RPC is the shop/inventory source of truth.
CREATE OR REPLACE FUNCTION public.list_center_active_merchandise_catalog(p_center_id uuid)
RETURNS TABLE (
  id uuid,
  sku text,
  name text,
  price_cents integer,
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
  SELECT mc.id, mc.sku, mc.name, mc.price_cents, mc.currency, mc.photo_urls
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
