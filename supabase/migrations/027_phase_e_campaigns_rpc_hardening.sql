-- Phase E: brand campaigns module, center assessments/reports, RPC-only mutations on journey tables

-- ---------------------------------------------------------------------------
-- Center assessments
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.student_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  center_id uuid NOT NULL REFERENCES public.franchise_centers(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  assessment_type text NOT NULL DEFAULT 'level_check',
  score numeric(5, 2),
  max_score numeric(5, 2),
  assessed_at date NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Kolkata')::date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_student_assessments_center ON public.student_assessments (center_id, assessed_at DESC);

DROP TRIGGER IF EXISTS student_assessments_audit ON public.student_assessments;
CREATE TRIGGER student_assessments_audit
  BEFORE INSERT OR UPDATE ON public.student_assessments
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

ALTER TABLE public.student_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS student_assessments_select ON public.student_assessments;
CREATE POLICY student_assessments_select ON public.student_assessments FOR SELECT TO authenticated
  USING (
    public.has_center_access(center_id)
    OR public.has_brand_access(brand_id)
    OR public.is_platform_admin()
  );

-- ---------------------------------------------------------------------------
-- Campaign RPCs
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.upsert_brand_campaign(
  p_brand_id uuid,
  p_name text,
  p_description text DEFAULT NULL,
  p_goal_type text DEFAULT 'enrollment',
  p_starts_at timestamptz DEFAULT NULL,
  p_ends_at timestamptz DEFAULT NULL,
  p_is_active boolean DEFAULT false,
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
  IF NOT public.brand_feature_enabled(p_brand_id, 'campaigns') THEN
    RAISE EXCEPTION 'feature_disabled';
  END IF;
  IF trim(coalesce(p_name, '')) = '' THEN
    RAISE EXCEPTION 'name is required';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.brand_campaigns (
      brand_id, name, description, goal_type, starts_at, ends_at, is_active
    )
    VALUES (
      p_brand_id,
      trim(p_name),
      nullif(trim(coalesce(p_description, '')), ''),
      coalesce(nullif(trim(p_goal_type), ''), 'enrollment'),
      p_starts_at,
      p_ends_at,
      coalesce(p_is_active, false)
    )
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.brand_campaigns
    SET
      name = trim(p_name),
      description = nullif(trim(coalesce(p_description, '')), ''),
      goal_type = coalesce(nullif(trim(p_goal_type), ''), 'enrollment'),
      starts_at = p_starts_at,
      ends_at = p_ends_at,
      is_active = coalesce(p_is_active, false),
      updated_at = now()
    WHERE id = p_id AND brand_id = p_brand_id
    RETURNING id INTO v_id;

    IF v_id IS NULL THEN
      RAISE EXCEPTION 'Campaign not found';
    END IF;
  END IF;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_brand_campaign(p_brand_id uuid, p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_brand_access(p_brand_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF NOT public.brand_feature_enabled(p_brand_id, 'campaigns') THEN
    RAISE EXCEPTION 'feature_disabled';
  END IF;

  DELETE FROM public.brand_campaigns WHERE id = p_id AND brand_id = p_brand_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campaign not found';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_active_brand_campaigns(p_brand_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'description', c.description,
      'goal_type', c.goal_type,
      'starts_at', c.starts_at,
      'ends_at', c.ends_at
    ) ORDER BY c.starts_at ASC NULLS LAST, c.name
  ), '[]'::jsonb)
  FROM public.brand_campaigns c
  WHERE c.brand_id = p_brand_id
    AND c.is_active = true
    AND (
      public.has_brand_access(p_brand_id)
      OR public.is_platform_admin()
      OR EXISTS (
        SELECT 1 FROM public.franchise_centers fc
        WHERE fc.brand_id = p_brand_id
          AND fc.deleted_at IS NULL
          AND public.has_center_access(fc.id)
      )
    )
    AND (c.ends_at IS NULL OR c.ends_at >= now())
    AND (c.starts_at IS NULL OR c.starts_at <= now() + interval '90 days');
$$;

-- ---------------------------------------------------------------------------
-- Kit RPCs (feature flag: kits)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.upsert_kit_catalog_item(
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
  IF NOT public.brand_feature_enabled(p_brand_id, 'kits') THEN
    RAISE EXCEPTION 'feature_disabled';
  END IF;
  IF trim(coalesce(p_sku, '')) = '' OR trim(coalesce(p_name, '')) = '' THEN
    RAISE EXCEPTION 'sku and name are required';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.kit_catalog (brand_id, sku, name, price_cents, currency, is_active)
    VALUES (p_brand_id, trim(p_sku), trim(p_name), p_price_cents, coalesce(nullif(trim(p_currency), ''), 'INR'), coalesce(p_is_active, true))
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.kit_catalog
    SET sku = trim(p_sku), name = trim(p_name), price_cents = p_price_cents,
        currency = coalesce(nullif(trim(p_currency), ''), 'INR'), is_active = coalesce(p_is_active, true),
        updated_at = now()
    WHERE id = p_id AND brand_id = p_brand_id
    RETURNING id INTO v_id;
    IF v_id IS NULL THEN RAISE EXCEPTION 'Kit item not found'; END IF;
  END IF;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_kit_catalog_item(p_brand_id uuid, p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_brand_access(p_brand_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF NOT public.brand_feature_enabled(p_brand_id, 'kits') THEN
    RAISE EXCEPTION 'feature_disabled';
  END IF;
  DELETE FROM public.kit_catalog WHERE id = p_id AND brand_id = p_brand_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Kit item not found'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_center_kit_order_rpc(
  p_brand_id uuid,
  p_center_id uuid,
  p_catalog_item_id uuid,
  p_quantity integer,
  p_unit_price_cents bigint
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
BEGIN
  IF NOT public.has_center_access(p_center_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF NOT public.brand_feature_enabled(p_brand_id, 'kits') THEN
    RAISE EXCEPTION 'feature_disabled';
  END IF;
  IF p_quantity IS NULL OR p_quantity < 1 THEN
    RAISE EXCEPTION 'quantity must be at least 1';
  END IF;

  INSERT INTO public.kit_orders (brand_id, center_id, status)
  VALUES (p_brand_id, p_center_id, 'submitted')
  RETURNING id INTO v_order_id;

  INSERT INTO public.kit_order_lines (order_id, catalog_item_id, quantity, unit_price_cents)
  VALUES (v_order_id, p_catalog_item_id, p_quantity, p_unit_price_cents);

  RETURN v_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_kit_order_status_rpc(p_order_id uuid, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.kit_orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order FROM public.kit_orders WHERE id = p_order_id FOR UPDATE;
  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  IF NOT public.brand_feature_enabled(v_order.brand_id, 'kits') THEN
    RAISE EXCEPTION 'feature_disabled';
  END IF;
  IF NOT (
    public.has_brand_access(v_order.brand_id)
    OR public.has_center_access(v_order.center_id)
    OR public.is_platform_admin()
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_status NOT IN ('submitted', 'approved', 'shipped', 'fulfilled', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  UPDATE public.kit_orders SET status = p_status, updated_at = now() WHERE id = p_order_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Student learn + assessment RPCs
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.upsert_brand_competition(
  p_brand_id uuid,
  p_name text,
  p_event_date date DEFAULT NULL,
  p_location text DEFAULT NULL,
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
  IF NOT public.brand_feature_enabled(p_brand_id, 'kits') THEN
    RAISE EXCEPTION 'feature_disabled';
  END IF;
  IF trim(coalesce(p_name, '')) = '' THEN
    RAISE EXCEPTION 'name is required';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.brand_competitions (brand_id, name, event_date, location, is_active)
    VALUES (p_brand_id, trim(p_name), p_event_date, nullif(trim(coalesce(p_location, '')), ''), coalesce(p_is_active, true))
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.brand_competitions
    SET name = trim(p_name), event_date = p_event_date,
        location = nullif(trim(coalesce(p_location, '')), ''), is_active = coalesce(p_is_active, true),
        updated_at = now()
    WHERE id = p_id AND brand_id = p_brand_id
    RETURNING id INTO v_id;
    IF v_id IS NULL THEN RAISE EXCEPTION 'Competition not found'; END IF;
  END IF;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_student_level_progress(
  p_center_id uuid,
  p_student_id uuid,
  p_level_name text,
  p_status text DEFAULT 'in_progress'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_id uuid;
  v_id uuid;
BEGIN
  IF NOT public.has_center_access(p_center_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT fc.brand_id INTO v_brand_id FROM public.franchise_centers fc
  WHERE fc.id = p_center_id AND fc.deleted_at IS NULL;
  IF v_brand_id IS NULL THEN RAISE EXCEPTION 'Center not found'; END IF;

  INSERT INTO public.student_level_progress (brand_id, center_id, student_id, level_name, status, completed_at)
  VALUES (
    v_brand_id, p_center_id, p_student_id, trim(p_level_name), coalesce(p_status, 'in_progress'),
    CASE WHEN coalesce(p_status, 'in_progress') = 'completed' THEN now() ELSE NULL END
  )
  ON CONFLICT (student_id, level_name) DO UPDATE
  SET status = EXCLUDED.status,
      completed_at = EXCLUDED.completed_at,
      updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_student_competition_entry(
  p_center_id uuid,
  p_student_id uuid,
  p_competition_id uuid,
  p_result_rank text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_id uuid;
  v_id uuid;
BEGIN
  IF NOT public.has_center_access(p_center_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT fc.brand_id INTO v_brand_id FROM public.franchise_centers fc
  WHERE fc.id = p_center_id AND fc.deleted_at IS NULL;
  IF v_brand_id IS NULL THEN RAISE EXCEPTION 'Center not found'; END IF;

  INSERT INTO public.student_competition_entries (brand_id, center_id, student_id, competition_id, result_rank)
  VALUES (v_brand_id, p_center_id, p_student_id, p_competition_id, nullif(trim(coalesce(p_result_rank, '')), ''))
  ON CONFLICT (student_id, competition_id) DO UPDATE
  SET result_rank = EXCLUDED.result_rank, updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_student_assessment(
  p_center_id uuid,
  p_student_id uuid,
  p_assessment_type text,
  p_score numeric DEFAULT NULL,
  p_max_score numeric DEFAULT NULL,
  p_assessed_at date DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_id uuid;
  v_id uuid;
BEGIN
  IF NOT public.has_center_access(p_center_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT fc.brand_id INTO v_brand_id FROM public.franchise_centers fc
  WHERE fc.id = p_center_id AND fc.deleted_at IS NULL;
  IF v_brand_id IS NULL THEN RAISE EXCEPTION 'Center not found'; END IF;

  INSERT INTO public.student_assessments (
    brand_id, center_id, student_id, assessment_type, score, max_score, assessed_at, notes
  )
  VALUES (
    v_brand_id, p_center_id, p_student_id,
    coalesce(nullif(trim(p_assessment_type), ''), 'level_check'),
    p_score, p_max_score,
    coalesce(p_assessed_at, (now() AT TIME ZONE 'Asia/Kolkata')::date),
    nullif(trim(coalesce(p_notes, '')), '')
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_center_ops_report(p_center_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_id uuid;
BEGIN
  SELECT brand_id INTO v_brand_id FROM public.franchise_centers WHERE id = p_center_id AND deleted_at IS NULL;
  IF v_brand_id IS NULL THEN
    RAISE EXCEPTION 'Center not found';
  END IF;
  IF NOT (
    public.has_center_access(p_center_id)
    OR public.has_brand_access(v_brand_id)
    OR public.is_platform_admin()
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN jsonb_build_object(
    'active_enrollments', (
      SELECT count(*)::int FROM public.student_enrollments e
      WHERE e.center_id = p_center_id AND e.status = 'active'
    ),
    'open_leads', (
      SELECT count(*)::int FROM public.leads l
      WHERE l.center_id = p_center_id AND l.status NOT IN ('converted', 'lost')
    ),
    'converted_leads', (
      SELECT count(*)::int FROM public.leads l
      WHERE l.center_id = p_center_id AND l.status = 'converted'
    ),
    'attendance_sessions_30d', (
      SELECT count(*)::int FROM public.attendance_sessions s
      WHERE s.center_id = p_center_id
        AND s.session_date >= (now() AT TIME ZONE 'Asia/Kolkata')::date - 30
    ),
    'assessments_30d', (
      SELECT count(*)::int FROM public.student_assessments a
      WHERE a.center_id = p_center_id
        AND a.assessed_at >= (now() AT TIME ZONE 'Asia/Kolkata')::date - 30
    ),
    'recent_assessments', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'student_name', st.full_name,
          'assessment_type', a.assessment_type,
          'score', a.score,
          'max_score', a.max_score,
          'assessed_at', a.assessed_at
        ) ORDER BY a.assessed_at DESC
      )
      FROM (
        SELECT * FROM public.student_assessments
        WHERE center_id = p_center_id
        ORDER BY assessed_at DESC
        LIMIT 10
      ) a
      JOIN public.students st ON st.id = a.student_id
    ), '[]'::jsonb)
  );
END;
$$;

-- Grants
REVOKE ALL ON FUNCTION public.upsert_brand_campaign(uuid, text, text, text, timestamptz, timestamptz, boolean, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_brand_campaign(uuid, text, text, text, timestamptz, timestamptz, boolean, uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.delete_brand_campaign(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_brand_campaign(uuid, uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.list_active_brand_campaigns(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_active_brand_campaigns(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.upsert_kit_catalog_item(uuid, text, text, bigint, text, boolean, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_kit_catalog_item(uuid, text, text, bigint, text, boolean, uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.delete_kit_catalog_item(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_kit_catalog_item(uuid, uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.create_center_kit_order_rpc(uuid, uuid, uuid, integer, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_center_kit_order_rpc(uuid, uuid, uuid, integer, bigint) TO authenticated;
REVOKE ALL ON FUNCTION public.update_kit_order_status_rpc(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_kit_order_status_rpc(uuid, text) TO authenticated;
REVOKE ALL ON FUNCTION public.upsert_brand_competition(uuid, text, date, text, boolean, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_brand_competition(uuid, text, date, text, boolean, uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.record_student_level_progress(uuid, uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_student_level_progress(uuid, uuid, text, text) TO authenticated;
REVOKE ALL ON FUNCTION public.record_student_competition_entry(uuid, uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_student_competition_entry(uuid, uuid, uuid, text) TO authenticated;
REVOKE ALL ON FUNCTION public.record_student_assessment(uuid, uuid, text, numeric, numeric, date, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_student_assessment(uuid, uuid, text, numeric, numeric, date, text) TO authenticated;
REVOKE ALL ON FUNCTION public.get_center_ops_report(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_center_ops_report(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- RPC-only hardening: SELECT policies only on journey mutation tables
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS leads_center_mutate ON public.leads;
DROP POLICY IF EXISTS leads_center_select ON public.leads;
CREATE POLICY leads_center_select ON public.leads FOR SELECT TO authenticated
  USING (
    public.is_platform_admin()
    OR public.has_brand_access(brand_id)
    OR (center_id IS NOT NULL AND public.has_center_access(center_id))
  );

DROP POLICY IF EXISTS franchise_inquiries_brand_update ON public.franchise_inquiries;
DROP POLICY IF EXISTS franchise_inquiries_brand_delete ON public.franchise_inquiries;

DROP POLICY IF EXISTS brand_campaigns_brand ON public.brand_campaigns;
DROP POLICY IF EXISTS brand_campaigns_select ON public.brand_campaigns;
CREATE POLICY brand_campaigns_select ON public.brand_campaigns FOR SELECT TO authenticated
  USING (public.has_brand_access(brand_id) OR public.is_platform_admin());

DROP POLICY IF EXISTS kit_catalog_brand ON public.kit_catalog;
DROP POLICY IF EXISTS kit_catalog_select ON public.kit_catalog;
CREATE POLICY kit_catalog_select ON public.kit_catalog FOR SELECT TO authenticated
  USING (public.has_brand_access(brand_id) OR public.is_platform_admin());

DROP POLICY IF EXISTS kit_orders_center ON public.kit_orders;
DROP POLICY IF EXISTS kit_orders_select ON public.kit_orders;
CREATE POLICY kit_orders_select ON public.kit_orders FOR SELECT TO authenticated
  USING (
    public.has_center_access(center_id)
    OR public.has_brand_access(brand_id)
    OR public.is_platform_admin()
  );

DROP POLICY IF EXISTS kit_order_lines_access ON public.kit_order_lines;
DROP POLICY IF EXISTS kit_order_lines_select ON public.kit_order_lines;
CREATE POLICY kit_order_lines_select ON public.kit_order_lines FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.kit_orders o
      WHERE o.id = kit_order_lines.order_id
        AND (
          public.has_center_access(o.center_id)
          OR public.has_brand_access(o.brand_id)
          OR public.is_platform_admin()
        )
    )
  );

DROP POLICY IF EXISTS student_kit_allocations_access ON public.student_kit_allocations;
DROP POLICY IF EXISTS student_kit_allocations_select ON public.student_kit_allocations;
CREATE POLICY student_kit_allocations_select ON public.student_kit_allocations FOR SELECT TO authenticated
  USING (
    public.has_center_access(center_id)
    OR public.has_brand_access(brand_id)
    OR public.is_platform_admin()
  );

DROP POLICY IF EXISTS brand_competitions_access ON public.brand_competitions;
DROP POLICY IF EXISTS brand_competitions_select ON public.brand_competitions;
CREATE POLICY brand_competitions_select ON public.brand_competitions FOR SELECT TO authenticated
  USING (
    public.has_brand_access(brand_id)
    OR public.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.franchise_centers fc
      WHERE fc.brand_id = brand_competitions.brand_id
        AND fc.deleted_at IS NULL
        AND public.has_center_access(fc.id)
    )
  );

DROP POLICY IF EXISTS student_level_progress_access ON public.student_level_progress;
DROP POLICY IF EXISTS student_level_progress_select ON public.student_level_progress;
CREATE POLICY student_level_progress_select ON public.student_level_progress FOR SELECT TO authenticated
  USING (
    public.has_center_access(center_id)
    OR public.has_brand_access(brand_id)
    OR public.is_platform_admin()
  );

DROP POLICY IF EXISTS student_competition_entries_access ON public.student_competition_entries;
DROP POLICY IF EXISTS student_competition_entries_select ON public.student_competition_entries;
CREATE POLICY student_competition_entries_select ON public.student_competition_entries FOR SELECT TO authenticated
  USING (
    public.has_center_access(center_id)
    OR public.has_brand_access(brand_id)
    OR public.is_platform_admin()
  );
