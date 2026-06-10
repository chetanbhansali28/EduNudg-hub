-- Merchandise RPCs: catalog, orders, payments, workflow, reminders

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.merchandise_payment_mode(p_brand_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    nullif(trim(bs.settings -> 'merchandise' ->> 'payment_mode'), ''),
    'both'
  )
  FROM public.brand_settings bs
  WHERE bs.brand_id = p_brand_id;
$$;

CREATE OR REPLACE FUNCTION public.merchandise_require_payment_before_fulfillment(p_brand_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (bs.settings -> 'merchandise' ->> 'require_payment_before_fulfillment')::boolean,
    true
  )
  FROM public.brand_settings bs
  WHERE bs.brand_id = p_brand_id;
$$;

CREATE OR REPLACE FUNCTION public.next_merchandise_invoice_number(p_brand_id uuid)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_seq integer;
  v_year text;
BEGIN
  v_year := to_char(now() AT TIME ZONE 'Asia/Kolkata', 'YYYY');
  SELECT count(*) + 1 INTO v_seq
  FROM public.merchandise_invoices mi
  WHERE mi.brand_id = p_brand_id
    AND mi.invoice_number LIKE 'MER-' || v_year || '-%';
  RETURN 'MER-' || v_year || '-' || lpad(v_seq::text, 5, '0');
END;
$$;

-- ---------------------------------------------------------------------------
-- Catalog (rename from kit RPCs)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.upsert_merchandise_catalog_item(
  p_brand_id uuid,
  p_sku text,
  p_name text,
  p_price_cents bigint,
  p_currency text DEFAULT 'INR',
  p_is_active boolean DEFAULT true,
  p_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT public.has_brand_access(p_brand_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF NOT public.brand_feature_enabled(p_brand_id, 'merchandise') THEN
    RAISE EXCEPTION 'feature_disabled';
  END IF;
  IF trim(coalesce(p_sku, '')) = '' OR trim(coalesce(p_name, '')) = '' THEN
    RAISE EXCEPTION 'sku and name are required';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.merchandise_catalog (brand_id, sku, name, price_cents, currency, is_active)
    VALUES (p_brand_id, trim(p_sku), trim(p_name), p_price_cents, coalesce(nullif(trim(p_currency), ''), 'INR'), coalesce(p_is_active, true))
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.merchandise_catalog
    SET sku = trim(p_sku), name = trim(p_name), price_cents = p_price_cents,
        currency = coalesce(nullif(trim(p_currency), ''), 'INR'), is_active = coalesce(p_is_active, true),
        updated_at = now()
    WHERE id = p_id AND brand_id = p_brand_id
    RETURNING id INTO v_id;
    IF v_id IS NULL THEN RAISE EXCEPTION 'Item not found'; END IF;
  END IF;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_merchandise_catalog_item(p_brand_id uuid, p_id uuid)
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
  DELETE FROM public.merchandise_catalog WHERE id = p_id AND brand_id = p_brand_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Item not found'; END IF;
END;
$$;

-- Backward-compatible aliases
CREATE OR REPLACE FUNCTION public.upsert_kit_catalog_item(
  p_brand_id uuid, p_sku text, p_name text, p_price_cents bigint,
  p_currency text DEFAULT 'INR', p_is_active boolean DEFAULT true, p_id uuid DEFAULT NULL
)
RETURNS uuid LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT public.upsert_merchandise_catalog_item(p_brand_id, p_sku, p_name, p_price_cents, p_currency, p_is_active, p_id);
$$;

CREATE OR REPLACE FUNCTION public.delete_kit_catalog_item(p_brand_id uuid, p_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT public.delete_merchandise_catalog_item(p_brand_id, p_id);
$$;

-- ---------------------------------------------------------------------------
-- Promo codes
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.validate_merchandise_promo_code(
  p_brand_id uuid,
  p_code text,
  p_total_quantity integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_promo public.merchandise_promo_codes%ROWTYPE;
  v_discount bigint;
BEGIN
  IF NOT public.brand_feature_enabled(p_brand_id, 'merchandise') THEN
    RAISE EXCEPTION 'feature_disabled';
  END IF;

  SELECT * INTO v_promo
  FROM public.merchandise_promo_codes
  WHERE brand_id = p_brand_id AND upper(code) = upper(trim(p_code)) AND is_active = true;

  IF v_promo.id IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Invalid promo code');
  END IF;
  IF v_promo.valid_from IS NOT NULL AND now() < v_promo.valid_from THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Promo not yet active');
  END IF;
  IF v_promo.valid_until IS NOT NULL AND now() > v_promo.valid_until THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Promo expired');
  END IF;
  IF p_total_quantity < v_promo.min_quantity THEN
    RETURN jsonb_build_object('valid', false, 'message', format('Minimum quantity %s required', v_promo.min_quantity));
  END IF;
  IF v_promo.max_uses IS NOT NULL AND v_promo.use_count >= v_promo.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Promo usage limit reached');
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'promo_code_id', v_promo.id,
    'discount_type', v_promo.discount_type,
    'discount_value', v_promo.discount_value
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_merchandise_promo_code(
  p_brand_id uuid,
  p_code text,
  p_discount_type text,
  p_discount_value bigint,
  p_min_quantity integer DEFAULT 1,
  p_description text DEFAULT NULL,
  p_max_uses integer DEFAULT NULL,
  p_valid_from timestamptz DEFAULT NULL,
  p_valid_until timestamptz DEFAULT NULL,
  p_is_active boolean DEFAULT true,
  p_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT public.has_brand_access(p_brand_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF NOT public.brand_feature_enabled(p_brand_id, 'merchandise') THEN
    RAISE EXCEPTION 'feature_disabled';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.merchandise_promo_codes (
      brand_id, code, description, discount_type, discount_value, min_quantity, max_uses, valid_from, valid_until, is_active
    ) VALUES (
      p_brand_id, upper(trim(p_code)), nullif(trim(p_description), ''), p_discount_type, p_discount_value,
      coalesce(p_min_quantity, 1), p_max_uses, p_valid_from, p_valid_until, coalesce(p_is_active, true)
    ) RETURNING id INTO v_id;
  ELSE
    UPDATE public.merchandise_promo_codes SET
      code = upper(trim(p_code)), description = nullif(trim(p_description), ''),
      discount_type = p_discount_type, discount_value = p_discount_value,
      min_quantity = coalesce(p_min_quantity, 1), max_uses = p_max_uses,
      valid_from = p_valid_from, valid_until = p_valid_until, is_active = coalesce(p_is_active, true),
      updated_at = now()
    WHERE id = p_id AND brand_id = p_brand_id
    RETURNING id INTO v_id;
    IF v_id IS NULL THEN RAISE EXCEPTION 'Promo not found'; END IF;
  END IF;
  RETURN v_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Create order (multi-line)
-- ---------------------------------------------------------------------------

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

CREATE OR REPLACE FUNCTION public.create_center_kit_order_rpc(
  p_brand_id uuid, p_center_id uuid, p_catalog_item_id uuid, p_quantity integer, p_unit_price_cents bigint
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN public.create_center_merchandise_order_rpc(
    p_brand_id, p_center_id,
    jsonb_build_array(jsonb_build_object(
      'catalog_item_id', p_catalog_item_id, 'quantity', p_quantity, 'unit_price_cents', p_unit_price_cents
    )),
    'franchise', '{}'::jsonb, NULL, 'invoice'
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- Invoice issue
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.issue_merchandise_invoice(p_order_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.merchandise_orders%ROWTYPE;
  v_invoice_id uuid;
  v_due_days integer;
  v_invoice_number text;
BEGIN
  SELECT * INTO v_order FROM public.merchandise_orders WHERE id = p_order_id FOR UPDATE;
  IF v_order.id IS NULL THEN RAISE EXCEPTION 'Order not found'; END IF;

  SELECT coalesce((bs.settings -> 'merchandise' ->> 'invoice_due_days')::integer, 7) INTO v_due_days
  FROM public.brand_settings bs WHERE bs.brand_id = v_order.brand_id;

  v_invoice_number := public.next_merchandise_invoice_number(v_order.brand_id);

  INSERT INTO public.merchandise_invoices (
    brand_id, center_id, order_id, invoice_number, amount_cents, currency, status, due_at
  ) VALUES (
    v_order.brand_id, v_order.center_id, v_order.id, v_invoice_number,
    v_order.total_cents, 'INR', 'sent', now() + (v_due_days || ' days')::interval
  )
  ON CONFLICT (order_id) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_invoice_id;

  INSERT INTO public.merchandise_reminder_log (brand_id, center_id, order_id, invoice_id, reminder_type, channel, metadata)
  VALUES (v_order.brand_id, v_order.center_id, v_order.id, v_invoice_id, 'invoice_issued', 'in_app', '{}'::jsonb)
  ON CONFLICT DO NOTHING;

  RETURN v_invoice_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Record payment
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.record_merchandise_payment(
  p_order_id uuid,
  p_amount_cents bigint,
  p_method text,
  p_razorpay_payment_id text DEFAULT NULL,
  p_razorpay_order_id text DEFAULT NULL,
  p_reference_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.merchandise_orders%ROWTYPE;
  v_invoice_id uuid;
  v_payment_id uuid;
BEGIN
  SELECT * INTO v_order FROM public.merchandise_orders WHERE id = p_order_id FOR UPDATE;
  IF v_order.id IS NULL THEN RAISE EXCEPTION 'Order not found'; END IF;

  SELECT id INTO v_invoice_id FROM public.merchandise_invoices WHERE order_id = p_order_id;

  INSERT INTO public.merchandise_payments (
    brand_id, center_id, order_id, invoice_id, amount_cents, method,
    razorpay_payment_id, razorpay_order_id, reference_notes
  ) VALUES (
    v_order.brand_id, v_order.center_id, p_order_id, v_invoice_id, p_amount_cents, p_method,
    p_razorpay_payment_id, p_razorpay_order_id, p_reference_notes
  ) RETURNING id INTO v_payment_id;

  UPDATE public.merchandise_orders SET
    payment_status = 'paid',
    status = CASE WHEN status = 'awaiting_payment' THEN 'placed' ELSE status END,
    updated_at = now()
  WHERE id = p_order_id;

  IF v_invoice_id IS NOT NULL THEN
    UPDATE public.merchandise_invoices SET status = 'paid', updated_at = now() WHERE id = v_invoice_id;
  END IF;

  RETURN v_payment_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Order status workflow
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.update_merchandise_order_status_rpc(
  p_order_id uuid,
  p_status text,
  p_shipping_tracking jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.merchandise_orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order FROM public.merchandise_orders WHERE id = p_order_id FOR UPDATE;
  IF v_order.id IS NULL THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF NOT public.brand_feature_enabled(v_order.brand_id, 'merchandise') THEN
    RAISE EXCEPTION 'feature_disabled';
  END IF;
  IF NOT (public.has_brand_access(v_order.brand_id) OR public.is_platform_admin()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_status NOT IN ('placed', 'approved', 'shipped', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status for brand update';
  END IF;
  IF p_status IN ('approved', 'shipped') AND public.merchandise_require_payment_before_fulfillment(v_order.brand_id)
     AND v_order.payment_status <> 'paid' THEN
    RAISE EXCEPTION 'Payment required before fulfillment';
  END IF;
  IF p_status = 'shipped' AND (p_shipping_tracking IS NULL OR coalesce(p_shipping_tracking ->> 'tracking_number', '') = '') THEN
    RAISE EXCEPTION 'Tracking number required when marking shipped';
  END IF;

  UPDATE public.merchandise_orders SET
    status = p_status,
    shipping_tracking = CASE WHEN p_status = 'shipped' THEN coalesce(p_shipping_tracking, shipping_tracking) ELSE shipping_tracking END,
    updated_at = now()
  WHERE id = p_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_kit_order_status_rpc(p_order_id uuid, p_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_mapped text;
BEGIN
  v_mapped := CASE p_status
    WHEN 'submitted' THEN 'placed'
    WHEN 'fulfilled' THEN 'complete'
    ELSE p_status
  END;
  PERFORM public.update_merchandise_order_status_rpc(p_order_id, v_mapped, NULL);
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_merchandise_order_received_rpc(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_order public.merchandise_orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order FROM public.merchandise_orders WHERE id = p_order_id FOR UPDATE;
  IF v_order.id IS NULL THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF NOT public.has_center_access(v_order.center_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF v_order.status <> 'shipped' THEN
    RAISE EXCEPTION 'Order must be shipped before marking received';
  END IF;
  UPDATE public.merchandise_orders SET status = 'received', received_at = now(), completed_at = now(), completed_by_role = 'center', updated_at = now()
  WHERE id = p_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_merchandise_order_rpc(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_order public.merchandise_orders%ROWTYPE;
  v_role text;
BEGIN
  SELECT * INTO v_order FROM public.merchandise_orders WHERE id = p_order_id FOR UPDATE;
  IF v_order.id IS NULL THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF public.has_brand_access(v_order.brand_id) OR public.is_platform_admin() THEN
    v_role := 'brand';
  ELSIF public.has_center_access(v_order.center_id) THEN
    v_role := 'center';
  ELSE
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF v_order.status NOT IN ('shipped', 'received') THEN
    RAISE EXCEPTION 'Order must be shipped or received before completing';
  END IF;
  UPDATE public.merchandise_orders SET status = 'complete', completed_at = now(), completed_by_role = v_role, updated_at = now()
  WHERE id = p_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.allocate_student_merchandise(
  p_center_id uuid, p_student_id uuid, p_order_line_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_id uuid;
  v_line record;
  v_id uuid;
BEGIN
  IF NOT public.has_center_access(p_center_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT fc.brand_id INTO v_brand_id FROM public.franchise_centers fc WHERE fc.id = p_center_id AND fc.deleted_at IS NULL;
  IF v_brand_id IS NULL THEN RAISE EXCEPTION 'Center not found'; END IF;

  SELECT mol.id, mo.center_id, mo.brand_id, mo.status
  INTO v_line
  FROM public.merchandise_order_lines mol
  JOIN public.merchandise_orders mo ON mo.id = mol.order_id
  WHERE mol.id = p_order_line_id AND mo.center_id = p_center_id;

  IF v_line.id IS NULL THEN RAISE EXCEPTION 'Order line not found'; END IF;
  IF v_line.status NOT IN ('approved', 'shipped', 'received', 'complete') THEN
    RAISE EXCEPTION 'Order must be approved before allocation';
  END IF;

  INSERT INTO public.student_merchandise_allocations (brand_id, center_id, student_id, order_line_id)
  VALUES (v_brand_id, p_center_id, p_student_id, p_order_line_id)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.allocate_student_kit(p_center_id uuid, p_student_id uuid, p_order_line_id uuid)
RETURNS uuid LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT public.allocate_student_merchandise(p_center_id, p_student_id, p_order_line_id);
$$;

-- ---------------------------------------------------------------------------
-- Payment alerts & reminders
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.list_center_merchandise_payment_alerts(p_center_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_center_access(p_center_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN jsonb_build_object(
    'unpaid_count', (
      SELECT count(*) FROM public.merchandise_orders mo
      WHERE mo.center_id = p_center_id AND mo.payment_status IN ('unpaid', 'pending')
        AND mo.status NOT IN ('cancelled', 'complete')
    ),
    'unpaid_total_cents', (
      SELECT coalesce(sum(mo.total_cents), 0) FROM public.merchandise_orders mo
      WHERE mo.center_id = p_center_id AND mo.payment_status IN ('unpaid', 'pending')
        AND mo.status NOT IN ('cancelled', 'complete')
    ),
    'overdue_count', (
      SELECT count(*) FROM public.merchandise_invoices mi
      JOIN public.merchandise_orders mo ON mo.id = mi.order_id
      WHERE mi.center_id = p_center_id AND mi.status = 'overdue'
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_merchandise_invoices_overdue()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count integer;
BEGIN
  UPDATE public.merchandise_invoices SET status = 'overdue', updated_at = now()
  WHERE status = 'sent' AND due_at < now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_merchandise_payment_reminders()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice record;
  v_order record;
  v_count integer := 0;
BEGIN
  PERFORM public.mark_merchandise_invoices_overdue();

  FOR v_invoice IN
    SELECT mi.*, mo.payment_status
    FROM public.merchandise_invoices mi
    JOIN public.merchandise_orders mo ON mo.id = mi.order_id
    WHERE mo.payment_status <> 'paid' AND mi.status IN ('sent', 'overdue')
  LOOP
    IF (v_invoice.due_at::date - current_date) = 3 THEN
      INSERT INTO public.merchandise_reminder_log (brand_id, center_id, order_id, invoice_id, reminder_type, channel)
      VALUES (v_invoice.brand_id, v_invoice.center_id, v_invoice.order_id, v_invoice.id, 'upcoming', 'email')
      ON CONFLICT DO NOTHING;
      v_count := v_count + 1;
    ELSIF v_invoice.due_at::date = current_date THEN
      INSERT INTO public.merchandise_reminder_log (brand_id, center_id, order_id, invoice_id, reminder_type, channel)
      VALUES (v_invoice.brand_id, v_invoice.center_id, v_invoice.order_id, v_invoice.id, 'due_today', 'email')
      ON CONFLICT DO NOTHING;
      v_count := v_count + 1;
    ELSIF v_invoice.status = 'overdue' AND (current_date - v_invoice.due_at::date) IN (1, 7) THEN
      INSERT INTO public.merchandise_reminder_log (brand_id, center_id, order_id, invoice_id, reminder_type, channel)
      VALUES (
        v_invoice.brand_id, v_invoice.center_id, v_invoice.order_id, v_invoice.id,
        CASE WHEN (current_date - v_invoice.due_at::date) = 7 THEN 'overdue_escalation' ELSE 'overdue' END,
        'email'
      )
      ON CONFLICT DO NOTHING;
      v_count := v_count + 1;
    END IF;
  END LOOP;

  FOR v_order IN
    SELECT * FROM public.merchandise_orders
    WHERE payment_status = 'pending' AND payment_method = 'razorpay'
      AND created_at < now() - interval '24 hours'
  LOOP
    INSERT INTO public.merchandise_reminder_log (brand_id, center_id, order_id, reminder_type, channel)
    VALUES (v_order.brand_id, v_order.center_id, v_order.id, 'payment_pending', 'email')
    ON CONFLICT DO NOTHING;
    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('reminders_queued', v_count);
END;
$$;

-- Fix competitions to use merchandise flag
CREATE OR REPLACE FUNCTION public.upsert_brand_competition(
  p_brand_id uuid, p_name text, p_event_date date DEFAULT NULL, p_location text DEFAULT NULL,
  p_is_active boolean DEFAULT true, p_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT public.has_brand_access(p_brand_id) AND NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF NOT public.brand_feature_enabled(p_brand_id, 'merchandise') THEN RAISE EXCEPTION 'feature_disabled'; END IF;
  IF trim(coalesce(p_name, '')) = '' THEN RAISE EXCEPTION 'name is required'; END IF;
  IF p_id IS NULL THEN
    INSERT INTO public.brand_competitions (brand_id, name, event_date, location, is_active)
    VALUES (p_brand_id, trim(p_name), p_event_date, nullif(trim(coalesce(p_location, '')), ''), coalesce(p_is_active, true))
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.brand_competitions SET name = trim(p_name), event_date = p_event_date,
      location = nullif(trim(coalesce(p_location, '')), ''), is_active = coalesce(p_is_active, true), updated_at = now()
    WHERE id = p_id AND brand_id = p_brand_id RETURNING id INTO v_id;
    IF v_id IS NULL THEN RAISE EXCEPTION 'Competition not found'; END IF;
  END IF;
  RETURN v_id;
END;
$$;

-- Grants
REVOKE ALL ON FUNCTION public.upsert_merchandise_catalog_item(uuid, text, text, bigint, text, boolean, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_merchandise_catalog_item(uuid, text, text, bigint, text, boolean, uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.delete_merchandise_catalog_item(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_merchandise_catalog_item(uuid, uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.validate_merchandise_promo_code(uuid, text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.validate_merchandise_promo_code(uuid, text, integer) TO authenticated;
REVOKE ALL ON FUNCTION public.upsert_merchandise_promo_code(uuid, text, text, bigint, integer, text, integer, timestamptz, timestamptz, boolean, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_merchandise_promo_code(uuid, text, text, bigint, integer, text, integer, timestamptz, timestamptz, boolean, uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.create_center_merchandise_order_rpc(uuid, uuid, jsonb, text, jsonb, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_center_merchandise_order_rpc(uuid, uuid, jsonb, text, jsonb, text, text) TO authenticated;
REVOKE ALL ON FUNCTION public.issue_merchandise_invoice(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.issue_merchandise_invoice(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.record_merchandise_payment(uuid, bigint, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_merchandise_payment(uuid, bigint, text, text, text, text) TO authenticated;
REVOKE ALL ON FUNCTION public.update_merchandise_order_status_rpc(uuid, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_merchandise_order_status_rpc(uuid, text, jsonb) TO authenticated;
REVOKE ALL ON FUNCTION public.mark_merchandise_order_received_rpc(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_merchandise_order_received_rpc(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.complete_merchandise_order_rpc(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_merchandise_order_rpc(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.allocate_student_merchandise(uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.allocate_student_merchandise(uuid, uuid, uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.list_center_merchandise_payment_alerts(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_center_merchandise_payment_alerts(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.process_merchandise_payment_reminders() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.process_merchandise_payment_reminders() TO service_role;
