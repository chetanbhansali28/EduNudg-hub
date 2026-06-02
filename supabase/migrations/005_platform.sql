-- Platform: subscriptions, audit, settings

CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  price_cents bigint NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  billing_interval text NOT NULL DEFAULT 'month',
  features jsonb DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE TRIGGER subscription_plans_audit BEFORE INSERT OR UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE TABLE public.brand_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE TRIGGER brand_subscriptions_audit BEFORE INSERT OR UPDATE ON public.brand_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE TABLE public.platform_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id),
  amount_cents bigint NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  status public.invoice_status NOT NULL DEFAULT 'draft',
  due_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE TRIGGER platform_invoices_audit BEFORE INSERT OR UPDATE ON public.platform_invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE TRIGGER platform_settings_audit BEFORE INSERT OR UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE TABLE public.brand_status_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  from_status public.brand_status,
  to_status public.brand_status NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE TABLE public.platform_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  brand_id uuid,
  center_id uuid,
  payload jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid REFERENCES public.brands(id),
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE TRIGGER support_tickets_audit BEFORE INSERT OR UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_status_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY subscription_plans_read ON public.subscription_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY subscription_plans_admin ON public.subscription_plans FOR ALL TO authenticated
  USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

CREATE POLICY brand_subs_select ON public.brand_subscriptions FOR SELECT TO authenticated
  USING (public.has_brand_access(brand_id) OR public.is_platform_admin());
CREATE POLICY brand_subs_admin ON public.brand_subscriptions FOR ALL TO authenticated
  USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

CREATE POLICY platform_audit_read ON public.platform_audit_logs FOR SELECT TO authenticated
  USING (public.is_platform_admin());
CREATE POLICY platform_audit_insert ON public.platform_audit_logs FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_admin() OR actor_id = auth.uid());
