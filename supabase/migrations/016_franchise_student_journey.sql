-- Franchise & student journey: leads SLA, platform signups, RPCs, kits/campaigns stubs

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.slugify_text(p_input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT trim(both '-' FROM regexp_replace(lower(coalesce(p_input, '')), '[^a-z0-9]+', '-', 'g'));
$$;

CREATE OR REPLACE FUNCTION public.normalize_phone_e164(p_raw text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_digits text;
BEGIN
  IF p_raw IS NULL OR trim(p_raw) = '' THEN
    RETURN NULL;
  END IF;
  v_digits := regexp_replace(p_raw, '\D', '', 'g');
  IF v_digits = '' THEN
    RETURN NULL;
  END IF;
  IF length(v_digits) = 10 THEN
    RETURN '+91' || v_digits;
  END IF;
  IF left(v_digits, 1) = '0' THEN
    v_digits := substring(v_digits FROM 2);
  END IF;
  IF length(v_digits) = 12 AND left(v_digits, 2) = '91' THEN
    RETURN '+' || v_digits;
  END IF;
  IF left(v_digits, 1) != '+' THEN
    RETURN '+' || v_digits;
  END IF;
  RETURN '+' || v_digits;
END;
$$;

CREATE OR REPLACE FUNCTION public.brand_settings_timezone(p_brand_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT bs.settings ->> 'timezone' FROM public.brand_settings bs WHERE bs.brand_id = p_brand_id),
    (SELECT ps.value ->> 'timezone' FROM public.platform_settings ps WHERE ps.key = 'defaults' LIMIT 1),
    'Asia/Kolkata'
  );
$$;

CREATE OR REPLACE FUNCTION public.brand_lead_stale_days(p_brand_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT (bs.settings ->> 'lead_stale_days')::integer FROM public.brand_settings bs WHERE bs.brand_id = p_brand_id),
    15
  );
$$;

CREATE OR REPLACE FUNCTION public.compute_lead_stale_at(p_brand_id uuid, p_assigned_at timestamptz)
RETURNS timestamptz
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT (
    (p_assigned_at AT TIME ZONE public.brand_settings_timezone(p_brand_id))
    + (public.brand_lead_stale_days(p_brand_id) || ' days')::interval
  ) AT TIME ZONE public.brand_settings_timezone(p_brand_id);
$$;

CREATE OR REPLACE FUNCTION public.brand_feature_enabled(p_brand_id uuid, p_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT (bs.settings -> 'features' ->> p_key)::boolean FROM public.brand_settings bs WHERE bs.brand_id = p_brand_id),
    true
  );
$$;

-- ---------------------------------------------------------------------------
-- Platform brand signups
-- ---------------------------------------------------------------------------

CREATE TABLE public.platform_brand_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_name text NOT NULL,
  admin_full_name text NOT NULL,
  email text NOT NULL,
  phone_e164 text,
  city text NOT NULL,
  country text DEFAULT 'IN',
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  proposed_slug text,
  rejected_reason text,
  converted_brand_id uuid REFERENCES public.brands(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE UNIQUE INDEX idx_platform_brand_signups_pending_email
  ON public.platform_brand_signups (lower(email))
  WHERE status = 'pending';

CREATE TRIGGER platform_brand_signups_audit
  BEFORE INSERT OR UPDATE ON public.platform_brand_signups
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

ALTER TABLE public.platform_brand_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY platform_brand_signups_admin ON public.platform_brand_signups
  FOR ALL TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Leads extensions
-- ---------------------------------------------------------------------------

ALTER TABLE public.leads
  ALTER COLUMN center_id DROP NOT NULL;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS lead_source text CHECK (lead_source IN ('brand', 'center')),
  ADD COLUMN IF NOT EXISTS whatsapp_e164 text,
  ADD COLUMN IF NOT EXISTS parent_name text,
  ADD COLUMN IF NOT EXISTS child_dob date,
  ADD COLUMN IF NOT EXISTS pincode text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS school_name text,
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz,
  ADD COLUMN IF NOT EXISTS assigned_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS last_center_action_at timestamptz,
  ADD COLUMN IF NOT EXISTS stale_at timestamptz,
  ADD COLUMN IF NOT EXISTS lost_reason text;

CREATE INDEX IF NOT EXISTS idx_leads_brand_status ON public.leads (brand_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_brand_whatsapp ON public.leads (brand_id, whatsapp_e164);

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS source_lead_id uuid REFERENCES public.leads(id),
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE TABLE IF NOT EXISTS public.student_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE UNIQUE,
  school_name text,
  city text,
  pincode text,
  extra jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE TRIGGER student_profiles_audit
  BEFORE INSERT OR UPDATE ON public.student_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE TABLE public.lead_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE TABLE public.lead_assignment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  from_center_id uuid REFERENCES public.franchise_centers(id),
  to_center_id uuid NOT NULL REFERENCES public.franchise_centers(id),
  assigned_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Franchise inquiries + centers public fields
-- ---------------------------------------------------------------------------

ALTER TABLE public.franchise_inquiries
  ADD COLUMN IF NOT EXISTS proposed_franchise_name text,
  ADD COLUMN IF NOT EXISTS address_line text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS pincode text,
  ADD COLUMN IF NOT EXISTS prior_experience text,
  ADD COLUMN IF NOT EXISTS converted_center_id uuid REFERENCES public.franchise_centers(id),
  ADD COLUMN IF NOT EXISTS rejected_reason text;

ALTER TABLE public.franchise_centers
  ADD COLUMN IF NOT EXISTS pincode text,
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS short_description text;

-- ---------------------------------------------------------------------------
-- Kits (Phase D)
-- ---------------------------------------------------------------------------

CREATE TABLE public.kit_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  sku text NOT NULL,
  name text NOT NULL,
  price_cents bigint NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE (brand_id, sku)
);

CREATE TRIGGER kit_catalog_audit BEFORE INSERT OR UPDATE ON public.kit_catalog
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE TABLE public.kit_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  center_id uuid NOT NULL REFERENCES public.franchise_centers(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'draft',
  shipping_address jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE TRIGGER kit_orders_audit BEFORE INSERT OR UPDATE ON public.kit_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE TABLE public.kit_order_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.kit_orders(id) ON DELETE CASCADE,
  catalog_item_id uuid NOT NULL REFERENCES public.kit_catalog(id),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_cents bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.student_kit_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  center_id uuid NOT NULL REFERENCES public.franchise_centers(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  order_line_id uuid REFERENCES public.kit_order_lines(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- ---------------------------------------------------------------------------
-- Campaigns (Phase E)
-- ---------------------------------------------------------------------------

CREATE TABLE public.brand_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  goal_type text NOT NULL DEFAULT 'enrollment',
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE TRIGGER brand_campaigns_audit BEFORE INSERT OR UPDATE ON public.brand_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_assignment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kit_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kit_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kit_order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_kit_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY lead_events_access ON public.lead_events FOR SELECT TO authenticated
  USING (public.has_brand_access(brand_id));

CREATE POLICY lead_assignment_history_access ON public.lead_assignment_history FOR SELECT TO authenticated
  USING (public.has_brand_access(brand_id));

CREATE POLICY student_profiles_access ON public.student_profiles FOR ALL TO authenticated
  USING (public.has_brand_access(brand_id))
  WITH CHECK (public.has_brand_access(brand_id));

CREATE POLICY kit_catalog_brand ON public.kit_catalog FOR ALL TO authenticated
  USING (public.has_brand_access(brand_id))
  WITH CHECK (public.has_brand_access(brand_id));

CREATE POLICY kit_orders_center ON public.kit_orders FOR ALL TO authenticated
  USING (public.has_center_access(center_id) OR public.has_brand_access(brand_id))
  WITH CHECK (public.has_center_access(center_id) OR public.has_brand_access(brand_id));

CREATE POLICY brand_campaigns_brand ON public.brand_campaigns FOR ALL TO authenticated
  USING (public.has_brand_access(brand_id))
  WITH CHECK (public.has_brand_access(brand_id));

-- Leads: brand sees all; center sees assigned
DROP POLICY IF EXISTS leads_center ON public.leads;

CREATE POLICY leads_brand_select ON public.leads FOR SELECT TO authenticated
  USING (public.has_brand_access(brand_id) OR public.is_platform_admin());

CREATE POLICY leads_center_mutate ON public.leads FOR ALL TO authenticated
  USING (
    public.is_platform_admin()
    OR (center_id IS NOT NULL AND public.has_center_access(center_id))
    OR (center_id IS NULL AND public.has_brand_access(brand_id))
  )
  WITH CHECK (
    public.is_platform_admin()
    OR (center_id IS NOT NULL AND public.has_center_access(center_id))
    OR (center_id IS NULL AND public.has_brand_access(brand_id))
  );

-- Platform defaults timezone
INSERT INTO public.platform_settings (key, value)
VALUES ('defaults', jsonb_build_object('timezone', 'Asia/Kolkata'))
ON CONFLICT (key) DO UPDATE SET value = public.platform_settings.value || EXCLUDED.value;
