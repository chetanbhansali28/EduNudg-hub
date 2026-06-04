-- Phase B completion: full SLA helper, WhatsApp uniqueness, lost-merge rules, center suggestions

-- ---------------------------------------------------------------------------
-- SLA: stale when past stale_at AND center never acted since assignment (D5, D10)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_lead_stale(
  p_center_id uuid,
  p_assigned_at timestamptz,
  p_stale_at timestamptz,
  p_last_center_action_at timestamptz,
  p_status public.lead_status
)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT p_center_id IS NOT NULL
    AND p_status NOT IN ('converted', 'lost')
    AND p_stale_at IS NOT NULL
    AND p_stale_at < now()
    AND (
      p_last_center_action_at IS NULL
      OR p_assigned_at IS NULL
      OR p_last_center_action_at < p_assigned_at
    );
$$;

CREATE OR REPLACE FUNCTION public.count_stale_brand_leads(p_brand_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer
  FROM public.leads l
  WHERE l.brand_id = p_brand_id
    AND public.has_brand_access(p_brand_id)
    AND public.is_lead_stale(
      l.center_id,
      l.assigned_at,
      l.stale_at,
      l.last_center_action_at,
      l.status
    );
$$;

REVOKE ALL ON FUNCTION public.count_stale_brand_leads(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_stale_brand_leads(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- WhatsApp uniqueness per brand (active pipeline rows only) — FR-X02
-- ---------------------------------------------------------------------------

DROP INDEX IF EXISTS public.idx_leads_brand_whatsapp;

CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_brand_whatsapp_active
  ON public.leads (brand_id, whatsapp_e164)
  WHERE status NOT IN ('lost');

-- ---------------------------------------------------------------------------
-- Merge: do not auto-reopen lost leads — brand must call reopen_lead (FR-B15b)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.upsert_lead_by_whatsapp(
  p_brand_id uuid,
  p_whatsapp text,
  p_payload jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wa text;
  v_id uuid;
  v_existing public.leads%ROWTYPE;
  v_lead_source text;
  v_center_id uuid;
BEGIN
  v_wa := public.normalize_phone_e164(p_whatsapp);
  IF v_wa IS NULL THEN
    RAISE EXCEPTION 'whatsapp_e164 is required';
  END IF;

  v_lead_source := coalesce(p_payload ->> 'lead_source', 'brand');
  v_center_id := (p_payload ->> 'center_id')::uuid;

  SELECT * INTO v_existing
  FROM public.leads l
  WHERE l.brand_id = p_brand_id AND l.whatsapp_e164 = v_wa
  ORDER BY l.created_at DESC
  LIMIT 1;

  IF v_existing.id IS NOT NULL THEN
    IF v_existing.status = 'converted' THEN
      RAISE EXCEPTION 'This student is already enrolled. Contact the center for changes.';
    END IF;

    UPDATE public.leads SET
      full_name = coalesce(nullif(trim(p_payload ->> 'parent_name'), ''), full_name),
      parent_name = coalesce(nullif(trim(p_payload ->> 'parent_name'), ''), parent_name),
      email = coalesce(nullif(trim(lower(p_payload ->> 'email')), ''), email),
      phone_e164 = coalesce(v_wa, phone_e164),
      child_name = coalesce(nullif(trim(p_payload ->> 'child_name'), ''), child_name),
      child_dob = coalesce((p_payload ->> 'child_dob')::date, child_dob),
      pincode = coalesce(nullif(trim(p_payload ->> 'pincode'), ''), pincode),
      city = coalesce(nullif(trim(p_payload ->> 'city'), ''), city),
      school_name = coalesce(nullif(trim(p_payload ->> 'school_name'), ''), school_name),
      notes = coalesce(nullif(trim(p_payload ->> 'notes'), ''), notes),
      center_id = CASE
        WHEN v_lead_source = 'center' AND v_center_id IS NOT NULL THEN v_center_id
        ELSE center_id
      END,
      lead_source = CASE
        WHEN v_lead_source = 'center' THEN 'center'
        ELSE lead_source
      END,
      updated_at = now()
    WHERE id = v_existing.id;

    INSERT INTO public.lead_events (lead_id, brand_id, event_type, payload, created_by)
    VALUES (
      v_existing.id,
      p_brand_id,
      'merged',
      p_payload || jsonb_build_object('prior_status', v_existing.status),
      auth.uid()
    );

    RETURN v_existing.id;
  END IF;

  INSERT INTO public.leads (
    brand_id, center_id, full_name, parent_name, email, phone_e164, whatsapp_e164,
    child_name, child_dob, pincode, city, school_name, notes, lead_source, source, status
  )
  VALUES (
    p_brand_id,
    CASE WHEN v_lead_source = 'center' THEN v_center_id ELSE NULL END,
    coalesce(nullif(trim(p_payload ->> 'parent_name'), ''), 'Parent'),
    nullif(trim(p_payload ->> 'parent_name'), ''),
    nullif(trim(lower(p_payload ->> 'email')), ''),
    v_wa,
    v_wa,
    nullif(trim(p_payload ->> 'child_name'), ''),
    (p_payload ->> 'child_dob')::date,
    nullif(trim(p_payload ->> 'pincode'), ''),
    nullif(trim(p_payload ->> 'city'), ''),
    nullif(trim(p_payload ->> 'school_name'), ''),
    nullif(trim(p_payload ->> 'notes'), ''),
    v_lead_source,
    v_lead_source,
    'new'
  )
  RETURNING id INTO v_id;

  INSERT INTO public.lead_events (lead_id, brand_id, event_type, payload, created_by)
  VALUES (v_id, p_brand_id, 'created', p_payload, auth.uid());

  RETURN v_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Assign: reject lost leads — use reopen_lead first (D13)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.assign_lead_to_center(p_lead_id uuid, p_center_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead public.leads%ROWTYPE;
BEGIN
  SELECT * INTO v_lead FROM public.leads WHERE id = p_lead_id FOR UPDATE;
  IF v_lead.id IS NULL OR NOT public.has_brand_access(v_lead.brand_id) THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;

  IF v_lead.status = 'lost' THEN
    RAISE EXCEPTION 'Reopen the lead before assigning';
  END IF;

  IF v_lead.status = 'converted' THEN
    RAISE EXCEPTION 'Cannot assign converted lead';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.franchise_centers c
    WHERE c.id = p_center_id AND c.brand_id = v_lead.brand_id AND c.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Invalid center';
  END IF;

  UPDATE public.leads SET
    center_id = p_center_id,
    assigned_at = now(),
    assigned_by = auth.uid(),
    last_center_action_at = NULL,
    stale_at = public.compute_lead_stale_at(v_lead.brand_id, now()),
    updated_at = now()
  WHERE id = p_lead_id;

  INSERT INTO public.lead_assignment_history (lead_id, brand_id, from_center_id, to_center_id, assigned_by)
  VALUES (p_lead_id, v_lead.brand_id, v_lead.center_id, p_center_id, auth.uid());
END;
$$;

-- ---------------------------------------------------------------------------
-- Pincode suggestions: include address for assign UI (B3)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.suggest_centers_for_lead(p_lead_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead public.leads%ROWTYPE;
  v_pin_last3 int;
  v_exact jsonb := '[]'::jsonb;
  v_near jsonb := '[]'::jsonb;
BEGIN
  SELECT * INTO v_lead FROM public.leads l WHERE l.id = p_lead_id;
  IF v_lead.id IS NULL OR NOT public.has_brand_access(v_lead.brand_id) THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'center_id', c.id,
    'name', coalesce(c.display_name, c.name),
    'slug', c.slug,
    'pincode', c.pincode,
    'city', c.city,
    'address_line1', c.address_line1,
    'distance_last3', 0
  ) ORDER BY c.name), '[]'::jsonb)
  INTO v_exact
  FROM public.franchise_centers c
  WHERE c.brand_id = v_lead.brand_id AND c.status = 'active' AND c.deleted_at IS NULL
    AND c.pincode IS NOT NULL AND v_lead.pincode IS NOT NULL
    AND c.pincode = v_lead.pincode;

  IF v_lead.pincode ~ '^\d{6}$' THEN
    v_pin_last3 := (v_lead.pincode::int % 1000);
  ELSE
    v_pin_last3 := NULL;
  END IF;

  SELECT coalesce(jsonb_agg(row ORDER BY (row ->> 'distance_last3')::int), '[]'::jsonb)
  INTO v_near
  FROM (
    SELECT jsonb_build_object(
      'center_id', c.id,
      'name', coalesce(c.display_name, c.name),
      'slug', c.slug,
      'pincode', c.pincode,
      'city', c.city,
      'address_line1', c.address_line1,
      'distance_last3', abs((c.pincode::int % 1000) - coalesce(v_pin_last3, 0))
    ) AS row
    FROM public.franchise_centers c
    WHERE c.brand_id = v_lead.brand_id AND c.status = 'active' AND c.deleted_at IS NULL
      AND c.pincode IS NOT NULL AND c.city IS NOT NULL AND v_lead.city IS NOT NULL
      AND lower(trim(c.city)) = lower(trim(v_lead.city))
      AND left(c.pincode, 3) = left(v_lead.pincode, 3)
      AND (v_exact = '[]'::jsonb OR NOT EXISTS (
        SELECT 1 FROM jsonb_array_elements(v_exact) e WHERE (e ->> 'center_id')::uuid = c.id
      ))
  ) sub;

  RETURN jsonb_build_object('exact', v_exact, 'near', v_near);
END;
$$;
