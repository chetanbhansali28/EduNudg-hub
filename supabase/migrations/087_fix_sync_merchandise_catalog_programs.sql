-- Fix sync_merchandise_catalog_programs: jsonb_array_elements exposes column `value`.
-- 085 selected `elem`, which raised 400 (column "elem" does not exist) when saving curriculum tags.

ALTER TABLE public.merchandise_catalog_programs
  DROP CONSTRAINT IF EXISTS merchandise_catalog_programs_catalog_item_id_program_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS merchandise_catalog_programs_program_only_uidx
  ON public.merchandise_catalog_programs (catalog_item_id, program_id)
  WHERE level_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS merchandise_catalog_programs_program_level_uidx
  ON public.merchandise_catalog_programs (catalog_item_id, program_id, level_id)
  WHERE level_id IS NOT NULL;

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

  IF p_links IS NOT NULL AND jsonb_typeof(p_links) = 'string' THEN
    p_links := (p_links #>> '{}')::jsonb;
  END IF;

  IF p_links IS NOT NULL AND jsonb_typeof(p_links) <> 'array' THEN
    RAISE EXCEPTION 'Invalid curriculum';
  END IF;

  FOR v_link IN SELECT value FROM jsonb_array_elements(coalesce(p_links, '[]'::jsonb)) LOOP
    v_program_id := nullif(coalesce(v_link ->> 'program_id', v_link ->> 'programId'), '')::uuid;
    v_level_id := nullif(coalesce(v_link ->> 'level_id', v_link ->> 'levelId'), '')::uuid;
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
    nullif(coalesce(value ->> 'program_id', value ->> 'programId'), '')::uuid,
    nullif(coalesce(value ->> 'level_id', value ->> 'levelId'), '')::uuid
  FROM jsonb_array_elements(coalesce(p_links, '[]'::jsonb))
  WHERE nullif(coalesce(value ->> 'program_id', value ->> 'programId'), '') IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_merchandise_catalog_programs(uuid, uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_merchandise_catalog_programs(uuid, uuid, jsonb) TO authenticated;

NOTIFY pgrst, 'reload schema';
