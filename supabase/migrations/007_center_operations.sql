-- Center: students, enrollments, leads, batches, attendance, fees, inventory

CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  student_code text,
  full_name text NOT NULL,
  date_of_birth date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  deleted_at timestamptz
);

CREATE INDEX idx_students_brand ON public.students (brand_id) WHERE deleted_at IS NULL;

CREATE TRIGGER students_audit BEFORE INSERT OR UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE TABLE public.parents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text,
  phone_e164 text,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE TRIGGER parents_audit BEFORE INSERT OR UPDATE ON public.parents
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE TABLE public.parent_student_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  parent_id uuid NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  relationship text DEFAULT 'guardian',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE (parent_id, student_id)
);

CREATE TRIGGER parent_student_links_audit BEFORE INSERT OR UPDATE ON public.parent_student_links
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE TABLE public.student_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  center_id uuid NOT NULL REFERENCES public.franchise_centers(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  curriculum_version_id uuid REFERENCES public.curriculum_versions(id),
  status public.enrollment_status NOT NULL DEFAULT 'active',
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_enrollments_center ON public.student_enrollments (center_id, status);

CREATE TRIGGER student_enrollments_audit BEFORE INSERT OR UPDATE ON public.student_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE TABLE public.enrollment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id),
  enrollment_id uuid NOT NULL REFERENCES public.student_enrollments(id),
  from_center_id uuid,
  to_center_id uuid,
  event_type text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE TABLE public.transfer_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id),
  student_id uuid NOT NULL REFERENCES public.students(id),
  from_center_id uuid NOT NULL REFERENCES public.franchise_centers(id),
  to_center_id uuid NOT NULL REFERENCES public.franchise_centers(id),
  status public.transfer_status NOT NULL DEFAULT 'pending',
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE TRIGGER transfer_requests_audit BEFORE INSERT OR UPDATE ON public.transfer_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  center_id uuid NOT NULL REFERENCES public.franchise_centers(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone_e164 text,
  email text,
  status public.lead_status NOT NULL DEFAULT 'new',
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_leads_center ON public.leads (center_id, status);

CREATE TRIGGER leads_audit BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE TABLE public.batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  center_id uuid NOT NULL REFERENCES public.franchise_centers(id) ON DELETE CASCADE,
  name text NOT NULL,
  level_id uuid REFERENCES public.levels(id),
  schedule jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE TRIGGER batches_audit BEFORE INSERT OR UPDATE ON public.batches
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE TABLE public.batch_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  center_id uuid NOT NULL REFERENCES public.franchise_centers(id) ON DELETE CASCADE,
  batch_id uuid NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES public.student_enrollments(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE (batch_id, student_id)
);

CREATE TRIGGER batch_enrollments_audit BEFORE INSERT OR UPDATE ON public.batch_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE TABLE public.attendance_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  center_id uuid NOT NULL REFERENCES public.franchise_centers(id) ON DELETE CASCADE,
  batch_id uuid NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  session_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE TRIGGER attendance_sessions_audit BEFORE INSERT OR UPDATE ON public.attendance_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE TABLE public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  center_id uuid NOT NULL REFERENCES public.franchise_centers(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  present boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE (session_id, student_id)
);

CREATE TRIGGER attendance_records_audit BEFORE INSERT OR UPDATE ON public.attendance_records
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE TABLE public.fee_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  center_id uuid REFERENCES public.franchise_centers(id),
  name text NOT NULL,
  amount_cents bigint NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  billing_cycle text DEFAULT 'monthly',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE TRIGGER fee_plans_audit BEFORE INSERT OR UPDATE ON public.fee_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  center_id uuid NOT NULL REFERENCES public.franchise_centers(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  invoice_number text,
  amount_cents bigint NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  status public.invoice_status NOT NULL DEFAULT 'draft',
  due_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_invoices_center ON public.invoices (center_id, status);

CREATE TRIGGER invoices_audit BEFORE INSERT OR UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  center_id uuid NOT NULL REFERENCES public.franchise_centers(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES public.invoices(id),
  amount_cents bigint NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  paid_at timestamptz NOT NULL DEFAULT now(),
  method text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE TRIGGER payments_audit BEFORE INSERT OR UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE TABLE public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  sku text,
  name text NOT NULL,
  item_type text DEFAULT 'book',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE TRIGGER inventory_items_audit BEFORE INSERT OR UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE TABLE public.inventory_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  center_id uuid NOT NULL REFERENCES public.franchise_centers(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  quantity int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE (center_id, item_id)
);

CREATE TRIGGER inventory_stock_audit BEFORE INSERT OR UPDATE ON public.inventory_stock
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

-- Center-scoped RLS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY students_brand ON public.students FOR ALL TO authenticated
  USING (public.has_brand_access(brand_id)) WITH CHECK (public.has_brand_access(brand_id));

CREATE POLICY enrollments_center ON public.student_enrollments FOR ALL TO authenticated
  USING (public.has_center_access(center_id)) WITH CHECK (public.has_center_access(center_id));

CREATE POLICY leads_center ON public.leads FOR ALL TO authenticated
  USING (public.has_center_access(center_id)) WITH CHECK (public.has_center_access(center_id));

CREATE POLICY batches_center ON public.batches FOR ALL TO authenticated
  USING (public.has_center_access(center_id)) WITH CHECK (public.has_center_access(center_id));

CREATE POLICY attendance_center ON public.attendance_sessions FOR ALL TO authenticated
  USING (public.has_center_access(center_id)) WITH CHECK (public.has_center_access(center_id));

CREATE POLICY attendance_records_center ON public.attendance_records FOR ALL TO authenticated
  USING (public.has_center_access(center_id)) WITH CHECK (public.has_center_access(center_id));

CREATE POLICY invoices_center ON public.invoices FOR ALL TO authenticated
  USING (public.has_center_access(center_id)) WITH CHECK (public.has_center_access(center_id));

CREATE POLICY payments_center ON public.payments FOR ALL TO authenticated
  USING (public.has_center_access(center_id)) WITH CHECK (public.has_center_access(center_id));

CREATE POLICY inventory_brand ON public.inventory_items FOR ALL TO authenticated
  USING (public.has_brand_access(brand_id)) WITH CHECK (public.has_brand_access(brand_id));

CREATE POLICY inventory_stock_center ON public.inventory_stock FOR ALL TO authenticated
  USING (public.has_center_access(center_id)) WITH CHECK (public.has_center_access(center_id));

CREATE POLICY transfer_requests_brand ON public.transfer_requests FOR ALL TO authenticated
  USING (public.has_brand_access(brand_id)) WITH CHECK (public.has_brand_access(brand_id));

CREATE POLICY enrollment_history_read ON public.enrollment_history FOR SELECT TO authenticated
  USING (public.has_brand_access(brand_id));

CREATE POLICY parents_brand ON public.parents FOR ALL TO authenticated
  USING (public.has_brand_access(brand_id)) WITH CHECK (public.has_brand_access(brand_id));

CREATE POLICY parent_links_brand ON public.parent_student_links FOR ALL TO authenticated
  USING (public.has_brand_access(brand_id)) WITH CHECK (public.has_brand_access(brand_id));

CREATE POLICY batch_enrollments_center ON public.batch_enrollments FOR ALL TO authenticated
  USING (public.has_center_access(center_id)) WITH CHECK (public.has_center_access(center_id));

CREATE POLICY fee_plans_access ON public.fee_plans FOR ALL TO authenticated
  USING (public.has_brand_access(brand_id) OR (center_id IS NOT NULL AND public.has_center_access(center_id)))
  WITH CHECK (public.has_brand_access(brand_id));
