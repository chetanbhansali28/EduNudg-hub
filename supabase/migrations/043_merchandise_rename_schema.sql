-- Merchandise: rename kit_* tables, extend schema, payments, reminders

-- ---------------------------------------------------------------------------
-- Rename tables (preserve data)
-- ---------------------------------------------------------------------------

ALTER TABLE IF EXISTS public.kit_catalog RENAME TO merchandise_catalog;
ALTER TABLE IF EXISTS public.kit_orders RENAME TO merchandise_orders;
ALTER TABLE IF EXISTS public.kit_order_lines RENAME TO merchandise_order_lines;
ALTER TABLE IF EXISTS public.student_kit_allocations RENAME TO student_merchandise_allocations;

-- ---------------------------------------------------------------------------
-- Feature flag: kits → merchandise
-- ---------------------------------------------------------------------------

UPDATE public.brand_settings
SET settings = jsonb_set(
  jsonb_set(
    COALESCE(settings, '{}'::jsonb),
    '{features}',
    (
      COALESCE(settings -> 'features', '{}'::jsonb)
      || jsonb_build_object(
        'merchandise',
        COALESCE(
          (settings -> 'features' ->> 'merchandise')::boolean,
          (settings -> 'features' ->> 'kits')::boolean,
          false
        )
      )
    ) - 'kits'
  ),
  '{merchandise}',
  COALESCE(settings -> 'merchandise', '{}'::jsonb),
  true
);

UPDATE public.subscription_plans
SET features = (features - 'kits') || jsonb_build_object(
  'merchandise',
  COALESCE((features ->> 'kits')::boolean, (features ->> 'merchandise')::boolean, false)
)
WHERE features ? 'kits' OR NOT (features ? 'merchandise');

CREATE OR REPLACE FUNCTION public.brand_feature_enabled(p_brand_id uuid, p_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_key = 'merchandise' THEN COALESCE(
      (SELECT (bs.settings -> 'features' ->> 'merchandise')::boolean FROM public.brand_settings bs WHERE bs.brand_id = p_brand_id),
      (SELECT (bs.settings -> 'features' ->> 'kits')::boolean FROM public.brand_settings bs WHERE bs.brand_id = p_brand_id),
      false
    )
    WHEN p_key = 'kits' THEN public.brand_feature_enabled(p_brand_id, 'merchandise')
    ELSE COALESCE(
      (SELECT (bs.settings -> 'features' ->> p_key)::boolean FROM public.brand_settings bs WHERE bs.brand_id = p_brand_id),
      true
    )
  END;
$$;

CREATE OR REPLACE FUNCTION public.brand_integration_enabled(p_brand_id uuid, p_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT (bs.settings -> 'integrations' ->> p_key)::boolean FROM public.brand_settings bs WHERE bs.brand_id = p_brand_id),
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- Student profile address fields
-- ---------------------------------------------------------------------------

ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS address_line1 text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS phone text;

-- ---------------------------------------------------------------------------
-- merchandise_orders extensions
-- ---------------------------------------------------------------------------

ALTER TABLE public.merchandise_orders
  ADD COLUMN IF NOT EXISTS shipping_mode text CHECK (shipping_mode IS NULL OR shipping_mode IN ('franchise', 'student', 'custom')),
  ADD COLUMN IF NOT EXISTS shipping_tracking jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS promo_code_id uuid,
  ADD COLUMN IF NOT EXISTS discount_cents bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subtotal_cents bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_cents bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'failed', 'refunded')),
  ADD COLUMN IF NOT EXISTS payment_method text CHECK (payment_method IS NULL OR payment_method IN ('razorpay', 'invoice')),
  ADD COLUMN IF NOT EXISTS received_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_by_role text CHECK (completed_by_role IS NULL OR completed_by_role IN ('brand', 'center')),
  ADD COLUMN IF NOT EXISTS razorpay_order_id text;

UPDATE public.merchandise_orders SET status = 'placed' WHERE status = 'submitted';
UPDATE public.merchandise_orders SET status = 'complete' WHERE status = 'fulfilled';
UPDATE public.merchandise_orders
SET payment_status = 'paid', total_cents = COALESCE(subtotal_cents, 0)
WHERE status IN ('approved', 'shipped', 'complete', 'received') AND payment_status = 'unpaid';

ALTER TABLE public.merchandise_order_lines
  ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES public.students(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- Promo codes
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.merchandise_promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  code text NOT NULL,
  description text,
  discount_type text NOT NULL DEFAULT 'percent' CHECK (discount_type IN ('percent', 'fixed')),
  discount_value bigint NOT NULL CHECK (discount_value > 0),
  min_quantity integer NOT NULL DEFAULT 1 CHECK (min_quantity >= 1),
  max_uses integer,
  use_count integer NOT NULL DEFAULT 0,
  valid_from timestamptz,
  valid_until timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE (brand_id, code)
);

CREATE INDEX IF NOT EXISTS idx_merchandise_promo_brand ON public.merchandise_promo_codes (brand_id, is_active);

DROP TRIGGER IF EXISTS merchandise_promo_codes_audit ON public.merchandise_promo_codes;
CREATE TRIGGER merchandise_promo_codes_audit
  BEFORE INSERT OR UPDATE ON public.merchandise_promo_codes
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

ALTER TABLE public.merchandise_orders
  DROP CONSTRAINT IF EXISTS merchandise_orders_promo_code_id_fkey;
ALTER TABLE public.merchandise_orders
  ADD CONSTRAINT merchandise_orders_promo_code_id_fkey
  FOREIGN KEY (promo_code_id) REFERENCES public.merchandise_promo_codes(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- Invoices & payments
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.merchandise_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  center_id uuid NOT NULL REFERENCES public.franchise_centers(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.merchandise_orders(id) ON DELETE CASCADE UNIQUE,
  invoice_number text NOT NULL,
  amount_cents bigint NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  status public.invoice_status NOT NULL DEFAULT 'sent',
  due_at timestamptz NOT NULL,
  pdf_storage_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE (brand_id, invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_merchandise_invoices_center ON public.merchandise_invoices (center_id, status);

DROP TRIGGER IF EXISTS merchandise_invoices_audit ON public.merchandise_invoices;
CREATE TRIGGER merchandise_invoices_audit
  BEFORE INSERT OR UPDATE ON public.merchandise_invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE TABLE IF NOT EXISTS public.merchandise_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  center_id uuid NOT NULL REFERENCES public.franchise_centers(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.merchandise_orders(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES public.merchandise_invoices(id) ON DELETE SET NULL,
  amount_cents bigint NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  method text NOT NULL CHECK (method IN ('razorpay', 'bank_transfer', 'upi', 'cash', 'manual')),
  razorpay_payment_id text,
  razorpay_order_id text,
  reference_notes text,
  paid_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_merchandise_payments_order ON public.merchandise_payments (order_id);

DROP TRIGGER IF EXISTS merchandise_payments_audit ON public.merchandise_payments;
CREATE TRIGGER merchandise_payments_audit
  BEFORE INSERT OR UPDATE ON public.merchandise_payments
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

-- ---------------------------------------------------------------------------
-- Reminder log
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.merchandise_reminder_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  center_id uuid NOT NULL REFERENCES public.franchise_centers(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.merchandise_orders(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES public.merchandise_invoices(id) ON DELETE CASCADE,
  reminder_type text NOT NULL CHECK (reminder_type IN (
    'invoice_issued', 'upcoming', 'due_today', 'overdue', 'overdue_escalation', 'payment_pending'
  )),
  channel text NOT NULL CHECK (channel IN ('in_app', 'email')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  recipient_email text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_merchandise_reminder_invoice_unique
  ON public.merchandise_reminder_log (invoice_id, reminder_type, channel)
  WHERE invoice_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_merchandise_reminder_order_unique
  ON public.merchandise_reminder_log (order_id, reminder_type, channel)
  WHERE invoice_id IS NULL;

-- ---------------------------------------------------------------------------
-- RLS policy renames
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS kit_catalog_brand ON public.merchandise_catalog;
CREATE POLICY merchandise_catalog_brand ON public.merchandise_catalog FOR ALL TO authenticated
  USING (public.has_brand_access(brand_id) OR public.is_platform_admin())
  WITH CHECK (public.has_brand_access(brand_id) OR public.is_platform_admin());

DROP POLICY IF EXISTS kit_orders_center ON public.merchandise_orders;
CREATE POLICY merchandise_orders_access ON public.merchandise_orders FOR ALL TO authenticated
  USING (public.has_center_access(center_id) OR public.has_brand_access(brand_id) OR public.is_platform_admin())
  WITH CHECK (public.has_center_access(center_id) OR public.has_brand_access(brand_id) OR public.is_platform_admin());

DROP POLICY IF EXISTS kit_order_lines_access ON public.merchandise_order_lines;
CREATE POLICY merchandise_order_lines_access ON public.merchandise_order_lines FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.merchandise_orders o
      WHERE o.id = merchandise_order_lines.order_id
        AND (public.has_center_access(o.center_id) OR public.has_brand_access(o.brand_id) OR public.is_platform_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.merchandise_orders o
      WHERE o.id = merchandise_order_lines.order_id
        AND (public.has_center_access(o.center_id) OR public.has_brand_access(o.brand_id) OR public.is_platform_admin())
    )
  );

DROP POLICY IF EXISTS student_kit_allocations_access ON public.student_merchandise_allocations;
CREATE POLICY student_merchandise_allocations_access ON public.student_merchandise_allocations FOR ALL TO authenticated
  USING (public.has_center_access(center_id) OR public.has_brand_access(brand_id) OR public.is_platform_admin())
  WITH CHECK (public.has_center_access(center_id) OR public.has_brand_access(brand_id) OR public.is_platform_admin());

ALTER TABLE public.merchandise_promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchandise_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchandise_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchandise_reminder_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY merchandise_promo_codes_brand ON public.merchandise_promo_codes FOR ALL TO authenticated
  USING (public.has_brand_access(brand_id) OR public.is_platform_admin())
  WITH CHECK (public.has_brand_access(brand_id) OR public.is_platform_admin());

CREATE POLICY merchandise_invoices_access ON public.merchandise_invoices FOR ALL TO authenticated
  USING (public.has_center_access(center_id) OR public.has_brand_access(brand_id) OR public.is_platform_admin())
  WITH CHECK (public.has_center_access(center_id) OR public.has_brand_access(brand_id) OR public.is_platform_admin());

CREATE POLICY merchandise_payments_access ON public.merchandise_payments FOR ALL TO authenticated
  USING (public.has_center_access(center_id) OR public.has_brand_access(brand_id) OR public.is_platform_admin())
  WITH CHECK (public.has_center_access(center_id) OR public.has_brand_access(brand_id) OR public.is_platform_admin());

CREATE POLICY merchandise_reminder_log_access ON public.merchandise_reminder_log FOR SELECT TO authenticated
  USING (public.has_center_access(center_id) OR public.has_brand_access(brand_id) OR public.is_platform_admin());

CREATE POLICY merchandise_reminder_log_insert ON public.merchandise_reminder_log FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_admin());
