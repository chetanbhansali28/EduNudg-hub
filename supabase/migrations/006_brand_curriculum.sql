-- Brand: settings, curriculum, royalties, territories

CREATE TABLE public.brand_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL UNIQUE REFERENCES public.brands(id) ON DELETE CASCADE,
  settings jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE TRIGGER brand_settings_audit BEFORE INSERT OR UPDATE ON public.brand_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE TABLE public.brand_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL UNIQUE REFERENCES public.brands(id) ON DELETE CASCADE,
  tokens jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE TRIGGER brand_themes_audit BEFORE INSERT OR UPDATE ON public.brand_themes
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE TABLE public.programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  deleted_at timestamptz
);

CREATE INDEX idx_programs_brand ON public.programs (brand_id) WHERE deleted_at IS NULL;

CREATE TRIGGER programs_audit BEFORE INSERT OR UPDATE ON public.programs
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE TABLE public.curriculum_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  version_number int NOT NULL,
  status public.curriculum_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE (program_id, version_number)
);

CREATE TRIGGER curriculum_versions_audit BEFORE INSERT OR UPDATE ON public.curriculum_versions
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE TABLE public.levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculum_version_id uuid NOT NULL REFERENCES public.curriculum_versions(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  unlock_rules jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE TRIGGER levels_audit BEFORE INSERT OR UPDATE ON public.levels
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE TABLE public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id uuid NOT NULL REFERENCES public.levels(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  title text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE TRIGGER modules_audit BEFORE INSERT OR UPDATE ON public.modules
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  title text NOT NULL,
  content_type text DEFAULT 'article',
  duration_minutes int,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE TRIGGER lessons_audit BEFORE INSERT OR UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE TABLE public.curriculum_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculum_version_id uuid NOT NULL REFERENCES public.curriculum_versions(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE TRIGGER curriculum_approvals_audit BEFORE INSERT OR UPDATE ON public.curriculum_approvals
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE TABLE public.royalty_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  rule_type public.royalty_type NOT NULL,
  config jsonb NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE TRIGGER royalty_rules_audit BEFORE INSERT OR UPDATE ON public.royalty_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE TABLE public.royalty_settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  center_id uuid REFERENCES public.franchise_centers(id),
  period_start date NOT NULL,
  period_end date NOT NULL,
  amount_cents bigint NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE TRIGGER royalty_settlements_audit BEFORE INSERT OR UPDATE ON public.royalty_settlements
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE TABLE public.territories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  geo jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE TRIGGER territories_audit BEFORE INSERT OR UPDATE ON public.territories
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

-- RLS brand-scoped
ALTER TABLE public.brand_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.royalty_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.royalty_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.territories ENABLE ROW LEVEL SECURITY;

CREATE POLICY brand_settings_access ON public.brand_settings FOR ALL TO authenticated
  USING (public.has_brand_access(brand_id)) WITH CHECK (public.has_brand_access(brand_id));

CREATE POLICY brand_themes_access ON public.brand_themes FOR ALL TO authenticated
  USING (public.has_brand_access(brand_id)) WITH CHECK (public.has_brand_access(brand_id));

CREATE POLICY programs_access ON public.programs FOR ALL TO authenticated
  USING (public.has_brand_access(brand_id)) WITH CHECK (public.has_brand_access(brand_id));

CREATE POLICY curriculum_versions_access ON public.curriculum_versions FOR ALL TO authenticated
  USING (public.has_brand_access(brand_id)) WITH CHECK (public.has_brand_access(brand_id));

CREATE POLICY levels_access ON public.levels FOR ALL TO authenticated
  USING (public.has_brand_access(brand_id)) WITH CHECK (public.has_brand_access(brand_id));

CREATE POLICY modules_access ON public.modules FOR ALL TO authenticated
  USING (public.has_brand_access(brand_id)) WITH CHECK (public.has_brand_access(brand_id));

CREATE POLICY lessons_access ON public.lessons FOR ALL TO authenticated
  USING (public.has_brand_access(brand_id)) WITH CHECK (public.has_brand_access(brand_id));

CREATE POLICY curriculum_approvals_access ON public.curriculum_approvals FOR ALL TO authenticated
  USING (public.has_brand_access(brand_id)) WITH CHECK (public.has_brand_access(brand_id));

CREATE POLICY royalty_rules_access ON public.royalty_rules FOR ALL TO authenticated
  USING (public.has_brand_access(brand_id)) WITH CHECK (public.has_brand_access(brand_id));

CREATE POLICY royalty_settlements_access ON public.royalty_settlements FOR ALL TO authenticated
  USING (public.has_brand_access(brand_id)) WITH CHECK (public.has_brand_access(brand_id));

CREATE POLICY territories_access ON public.territories FOR ALL TO authenticated
  USING (public.has_brand_access(brand_id)) WITH CHECK (public.has_brand_access(brand_id));
