-- Tie merchandise SKUs to brand curriculum. Franchise shop and inventory
-- only show SKUs linked to programs assigned in center_program_enablement.

CREATE TABLE IF NOT EXISTS public.merchandise_catalog_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  catalog_item_id uuid NOT NULL REFERENCES public.merchandise_catalog(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE (catalog_item_id, program_id)
);

CREATE INDEX IF NOT EXISTS idx_merchandise_catalog_programs_brand
  ON public.merchandise_catalog_programs (brand_id);
CREATE INDEX IF NOT EXISTS idx_merchandise_catalog_programs_program
  ON public.merchandise_catalog_programs (program_id);

DROP TRIGGER IF EXISTS merchandise_catalog_programs_audit ON public.merchandise_catalog_programs;
CREATE TRIGGER merchandise_catalog_programs_audit
  BEFORE INSERT OR UPDATE ON public.merchandise_catalog_programs
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

ALTER TABLE public.merchandise_catalog_programs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS merchandise_catalog_programs_brand ON public.merchandise_catalog_programs;
CREATE POLICY merchandise_catalog_programs_brand ON public.merchandise_catalog_programs
  FOR ALL TO authenticated
  USING (public.has_brand_access(brand_id) OR public.is_platform_admin())
  WITH CHECK (public.has_brand_access(brand_id) OR public.is_platform_admin());

DROP POLICY IF EXISTS merchandise_catalog_programs_center_read ON public.merchandise_catalog_programs;
CREATE POLICY merchandise_catalog_programs_center_read ON public.merchandise_catalog_programs
  FOR SELECT TO authenticated
  USING (
    public.brand_feature_enabled(brand_id, 'merchandise')
    AND EXISTS (
      SELECT 1
      FROM public.franchise_centers fc
      WHERE fc.brand_id = merchandise_catalog_programs.brand_id
        AND public.has_center_access(fc.id)
    )
  );

COMMENT ON TABLE public.merchandise_catalog_programs IS
  'SKU-to-curriculum links. Centers only see catalog items that match center_program_enablement.';

CREATE OR REPLACE FUNCTION public.center_can_order_catalog_item(
  p_center_id uuid,
  p_catalog_item_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.merchandise_catalog mc
    JOIN public.franchise_centers fc
      ON fc.id = p_center_id
     AND fc.brand_id = mc.brand_id
     AND fc.deleted_at IS NULL
    WHERE mc.id = p_catalog_item_id
      AND mc.is_active = true
      AND EXISTS (
        SELECT 1
        FROM public.merchandise_catalog_programs mcp
        JOIN public.center_program_enablement cpe
          ON cpe.program_id = mcp.program_id
         AND cpe.center_id = p_center_id
         AND cpe.brand_id = mc.brand_id
        JOIN public.programs p
          ON p.id = mcp.program_id
         AND p.deleted_at IS NULL
        WHERE mcp.catalog_item_id = mc.id
      )
  );
$$;

COMMENT ON FUNCTION public.center_can_order_catalog_item(uuid, uuid) IS
  'True when the SKU is active and tied to a curriculum assigned to that franchise.';

CREATE OR REPLACE FUNCTION public.sync_merchandise_catalog_programs(
  p_brand_id uuid,
  p_catalog_item_id uuid,
  p_program_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  IF EXISTS (
    SELECT 1
    FROM unnest(coalesce(p_program_ids, '{}'::uuid[])) AS pid
    WHERE NOT EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.id = pid AND p.brand_id = p_brand_id AND p.deleted_at IS NULL
    )
  ) THEN
    RAISE EXCEPTION 'Invalid curriculum';
  END IF;

  DELETE FROM public.merchandise_catalog_programs mcp
  WHERE mcp.catalog_item_id = p_catalog_item_id
    AND mcp.brand_id = p_brand_id;

  INSERT INTO public.merchandise_catalog_programs (brand_id, catalog_item_id, program_id)
  SELECT p_brand_id, p_catalog_item_id, pid
  FROM unnest(coalesce(p_program_ids, '{}'::uuid[])) AS pid
  ON CONFLICT (catalog_item_id, program_id) DO NOTHING;
END;
$$;

DROP POLICY IF EXISTS merchandise_catalog_center_read ON public.merchandise_catalog;
CREATE POLICY merchandise_catalog_center_read ON public.merchandise_catalog
  FOR SELECT TO authenticated
  USING (
    is_active = true
    AND public.brand_feature_enabled(brand_id, 'merchandise')
    AND EXISTS (
      SELECT 1
      FROM public.franchise_centers fc
      WHERE fc.brand_id = merchandise_catalog.brand_id
        AND fc.deleted_at IS NULL
        AND public.has_center_access(fc.id)
        AND EXISTS (
          SELECT 1
          FROM public.merchandise_catalog_programs mcp
          JOIN public.center_program_enablement cpe
            ON cpe.program_id = mcp.program_id
           AND cpe.center_id = fc.id
           AND cpe.brand_id = merchandise_catalog.brand_id
          WHERE mcp.catalog_item_id = merchandise_catalog.id
        )
    )
  );

CREATE OR REPLACE FUNCTION public.create_center_merchandise_order_rpc(
  p_brand_id uuid,
  p_center_id uuid,
  p_lines jsonb,
  p_shipping_mode text,
  p_shipping_address jsonb DEFAULT '{}'::jsonb,
  p_promo_code text DEFAULT NULL,
  p_payment_method text DEFAULT 'invoice'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_line jsonb;
  v_subtotal bigint := 0;
  v_discount bigint := 0;
  v_total bigint;
  v_promo jsonb;
  v_promo_id uuid;
  v_qty integer := 0;
  v_status text;
  v_payment_status text;
BEGIN
  IF NOT public.has_center_access(p_center_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF NOT public.brand_feature_enabled(p_brand_id, 'merchandise') THEN
    RAISE EXCEPTION 'feature_disabled';
  END IF;
  IF p_lines IS NULL OR jsonb_array_length(p_lines) < 1 THEN
    RAISE EXCEPTION 'At least one line required';
  END IF;
  IF p_payment_method NOT IN ('invoice', 'razorpay') THEN
    RAISE EXCEPTION 'Invalid payment method';
  END IF;

  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines) LOOP
    IF NOT public.center_can_order_catalog_item(p_center_id, (v_line ->> 'catalog_item_id')::uuid) THEN
      RAISE EXCEPTION 'catalog_not_available_for_center';
    END IF;
    v_qty := v_qty + coalesce((v_line ->> 'quantity')::integer, 0);
    v_subtotal := v_subtotal + coalesce((v_line ->> 'quantity')::integer, 0) * coalesce((v_line ->> 'unit_price_cents')::bigint, 0);
  END LOOP;

  IF p_promo_code IS NOT NULL AND trim(p_promo_code) <> '' THEN
    v_promo := public.validate_merchandise_promo_code(p_brand_id, p_promo_code, v_qty);
    IF NOT (v_promo ->> 'valid')::boolean THEN
      RAISE EXCEPTION '%', coalesce(v_promo ->> 'message', 'Invalid promo');
    END IF;
    v_promo_id := (v_promo ->> 'promo_code_id')::uuid;
    IF v_promo ->> 'discount_type' = 'percent' THEN
      v_discount := (v_subtotal * (v_promo ->> 'discount_value')::bigint) / 100;
    ELSE
      v_discount := (v_promo ->> 'discount_value')::bigint;
    END IF;
    v_discount := least(v_discount, v_subtotal);
  END IF;

  v_total := greatest(v_subtotal - v_discount, 0);

  IF p_payment_method = 'razorpay' THEN
    v_status := 'awaiting_payment';
    v_payment_status := 'pending';
  ELSE
    v_status := 'placed';
    v_payment_status := 'unpaid';
  END IF;

  INSERT INTO public.merchandise_orders (
    brand_id, center_id, status, shipping_mode, shipping_address,
    promo_code_id, discount_cents, subtotal_cents, total_cents,
    payment_status, payment_method
  ) VALUES (
    p_brand_id, p_center_id, v_status, p_shipping_mode, coalesce(p_shipping_address, '{}'::jsonb),
    v_promo_id, v_discount, v_subtotal, v_total, v_payment_status, p_payment_method
  ) RETURNING id INTO v_order_id;

  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines) LOOP
    INSERT INTO public.merchandise_order_lines (order_id, catalog_item_id, quantity, unit_price_cents, student_id)
    VALUES (
      v_order_id,
      (v_line ->> 'catalog_item_id')::uuid,
      (v_line ->> 'quantity')::integer,
      (v_line ->> 'unit_price_cents')::bigint,
      nullif(v_line ->> 'student_id', '')::uuid
    );
    IF nullif(v_line ->> 'student_id', '') IS NOT NULL THEN
      INSERT INTO public.student_merchandise_allocations (brand_id, center_id, student_id, order_line_id)
      SELECT p_brand_id, p_center_id, (v_line ->> 'student_id')::uuid, mol.id
      FROM public.merchandise_order_lines mol
      WHERE mol.order_id = v_order_id AND mol.catalog_item_id = (v_line ->> 'catalog_item_id')::uuid
      ORDER BY mol.created_at DESC LIMIT 1;
    END IF;
  END LOOP;

  IF v_promo_id IS NOT NULL THEN
    UPDATE public.merchandise_promo_codes SET use_count = use_count + 1, updated_at = now() WHERE id = v_promo_id;
  END IF;

  IF p_payment_method = 'invoice' THEN
    PERFORM public.issue_merchandise_invoice(v_order_id);
  END IF;

  RETURN v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.center_can_order_catalog_item(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.center_can_order_catalog_item(uuid, uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.sync_merchandise_catalog_programs(uuid, uuid, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_merchandise_catalog_programs(uuid, uuid, uuid[]) TO authenticated;
