-- Phase D: student learn dashboard data, kit order workflow helpers

-- ---------------------------------------------------------------------------
-- Student level progress (center staff records; parents see via learn RPC)
-- ---------------------------------------------------------------------------

CREATE TABLE public.student_level_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  center_id uuid NOT NULL REFERENCES public.franchise_centers(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES public.student_enrollments(id) ON DELETE SET NULL,
  level_id uuid REFERENCES public.levels(id) ON DELETE SET NULL,
  level_name text NOT NULL,
  status text NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed')),
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE (student_id, level_name)
);

CREATE INDEX idx_student_level_progress_student ON public.student_level_progress (student_id, status);

CREATE TRIGGER student_level_progress_audit
  BEFORE INSERT OR UPDATE ON public.student_level_progress
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

-- ---------------------------------------------------------------------------
-- Brand competitions (visible to linked parents on learn dashboard)
-- ---------------------------------------------------------------------------

CREATE TABLE public.brand_competitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  event_date date,
  location text,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE TRIGGER brand_competitions_audit
  BEFORE INSERT OR UPDATE ON public.brand_competitions
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE TABLE public.student_competition_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  center_id uuid NOT NULL REFERENCES public.franchise_centers(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  competition_id uuid NOT NULL REFERENCES public.brand_competitions(id) ON DELETE CASCADE,
  result_rank text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE (student_id, competition_id)
);

CREATE TRIGGER student_competition_entries_audit
  BEFORE INSERT OR UPDATE ON public.student_competition_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.student_level_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_competition_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY student_level_progress_access ON public.student_level_progress FOR ALL TO authenticated
  USING (
    public.has_center_access(center_id)
    OR public.has_brand_access(brand_id)
    OR public.is_platform_admin()
  )
  WITH CHECK (
    public.has_center_access(center_id)
    OR public.has_brand_access(brand_id)
    OR public.is_platform_admin()
  );

CREATE POLICY brand_competitions_access ON public.brand_competitions FOR ALL TO authenticated
  USING (public.has_brand_access(brand_id) OR public.is_platform_admin())
  WITH CHECK (public.has_brand_access(brand_id) OR public.is_platform_admin());

CREATE POLICY student_competition_entries_access ON public.student_competition_entries FOR ALL TO authenticated
  USING (
    public.has_center_access(center_id)
    OR public.has_brand_access(brand_id)
    OR public.is_platform_admin()
  )
  WITH CHECK (
    public.has_center_access(center_id)
    OR public.has_brand_access(brand_id)
    OR public.is_platform_admin()
  );

-- ---------------------------------------------------------------------------
-- Learn portal: parent-linked student read helper
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_parent_of_student(p_student_id uuid, p_brand_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.parent_student_links psl
    JOIN public.parents p ON p.id = psl.parent_id
    WHERE psl.student_id = p_student_id
      AND p.user_id = auth.uid()
      AND (p_brand_id IS NULL OR psl.brand_id = p_brand_id)
  );
$$;

REVOKE ALL ON FUNCTION public.is_parent_of_student(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_parent_of_student(uuid, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Student learn dashboard (parents only; no kits per FR-S03)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_student_learn_dashboard(p_brand_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT jsonb_build_object(
    'students', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'student_id', s.id,
          'full_name', s.full_name,
          'enrollments', (
            SELECT COALESCE(jsonb_agg(
              jsonb_build_object(
                'enrollment_id', e.id,
                'status', e.status,
                'center_name', COALESCE(fc.display_name, fc.name)
              )
            ), '[]'::jsonb)
            FROM public.student_enrollments e
            JOIN public.franchise_centers fc ON fc.id = e.center_id
            WHERE e.student_id = s.id
              AND e.brand_id = p_brand_id
              AND e.status = 'active'
          ),
          'progress', (
            SELECT COALESCE(jsonb_agg(
              jsonb_build_object(
                'level_name', slp.level_name,
                'status', slp.status,
                'completed_at', slp.completed_at
              ) ORDER BY slp.updated_at DESC
            ), '[]'::jsonb)
            FROM public.student_level_progress slp
            WHERE slp.student_id = s.id AND slp.brand_id = p_brand_id
          ),
          'competitions', (
            SELECT COALESCE(jsonb_agg(
              jsonb_build_object(
                'competition_name', bc.name,
                'event_date', bc.event_date,
                'result_rank', sce.result_rank
              ) ORDER BY bc.event_date DESC NULLS LAST
            ), '[]'::jsonb)
            FROM public.student_competition_entries sce
            JOIN public.brand_competitions bc ON bc.id = sce.competition_id
            WHERE sce.student_id = s.id
              AND sce.brand_id = p_brand_id
              AND bc.is_active = true
          )
        )
      )
      FROM public.students s
      WHERE s.brand_id = p_brand_id
        AND s.deleted_at IS NULL
        AND public.is_parent_of_student(s.id, p_brand_id)
    ), '[]'::jsonb),
    'upcoming_competitions', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', bc.id,
          'name', bc.name,
          'event_date', bc.event_date,
          'location', bc.location
        ) ORDER BY bc.event_date ASC NULLS LAST
      )
      FROM public.brand_competitions bc
      WHERE bc.brand_id = p_brand_id
        AND bc.is_active = true
        AND (bc.event_date IS NULL OR bc.event_date >= (now() AT TIME ZONE 'Asia/Kolkata')::date)
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_student_learn_dashboard(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_student_learn_dashboard(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Kit allocation RPC (center staff)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.allocate_student_kit(
  p_center_id uuid,
  p_student_id uuid,
  p_order_line_id uuid
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

  SELECT fc.brand_id INTO v_brand_id
  FROM public.franchise_centers fc
  WHERE fc.id = p_center_id AND fc.deleted_at IS NULL;

  IF v_brand_id IS NULL THEN
    RAISE EXCEPTION 'Center not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = p_student_id AND s.brand_id = v_brand_id AND s.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Student not found';
  END IF;

  SELECT kol.id, ko.center_id, ko.brand_id, ko.status
  INTO v_line
  FROM public.kit_order_lines kol
  JOIN public.kit_orders ko ON ko.id = kol.order_id
  WHERE kol.id = p_order_line_id
    AND ko.center_id = p_center_id;

  IF v_line.id IS NULL THEN
    RAISE EXCEPTION 'Order line not found';
  END IF;

  IF v_line.status NOT IN ('approved', 'shipped', 'fulfilled') THEN
    RAISE EXCEPTION 'Order must be approved before allocation';
  END IF;

  INSERT INTO public.student_kit_allocations (brand_id, center_id, student_id, order_line_id)
  VALUES (v_brand_id, p_center_id, p_student_id, p_order_line_id)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.allocate_student_kit(uuid, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.allocate_student_kit(uuid, uuid, uuid) TO authenticated;
