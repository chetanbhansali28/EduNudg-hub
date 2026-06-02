-- Financial events (append-only) and analytics rollups

CREATE TABLE public.financial_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid REFERENCES public.brands(id),
  center_id uuid REFERENCES public.franchise_centers(id),
  event_type text NOT NULL,
  amount_cents bigint NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  reference_type text,
  reference_id uuid,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE TABLE public.analytics_daily_brand (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  metric_date date NOT NULL,
  enrollments_count int DEFAULT 0,
  revenue_cents bigint DEFAULT 0,
  active_centers int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE (brand_id, metric_date)
);

CREATE TRIGGER analytics_daily_brand_audit BEFORE INSERT OR UPDATE ON public.analytics_daily_brand
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE TABLE public.analytics_daily_center (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  center_id uuid NOT NULL REFERENCES public.franchise_centers(id) ON DELETE CASCADE,
  metric_date date NOT NULL,
  attendance_rate numeric(5,2),
  leads_count int DEFAULT 0,
  enrollments_count int DEFAULT 0,
  fees_collected_cents bigint DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE (center_id, metric_date)
);

CREATE TRIGGER analytics_daily_center_audit BEFORE INSERT OR UPDATE ON public.analytics_daily_center
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

ALTER TABLE public.financial_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily_brand ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily_center ENABLE ROW LEVEL SECURITY;

CREATE POLICY financial_events_read ON public.financial_events FOR SELECT TO authenticated
  USING (
    public.is_platform_admin()
    OR (brand_id IS NOT NULL AND public.has_brand_access(brand_id))
    OR (center_id IS NOT NULL AND public.has_center_access(center_id))
  );

CREATE POLICY financial_events_insert ON public.financial_events FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY analytics_brand ON public.analytics_daily_brand FOR SELECT TO authenticated
  USING (public.has_brand_access(brand_id));

CREATE POLICY analytics_center ON public.analytics_daily_center FOR SELECT TO authenticated
  USING (public.has_center_access(center_id) OR public.has_brand_access(brand_id));
