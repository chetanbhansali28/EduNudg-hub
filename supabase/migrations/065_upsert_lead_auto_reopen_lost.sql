-- Restore auto-reopen on WhatsApp merge for lost leads (FR-B15b).
-- Converted leads still reject (no soft-merge). Brand reopen_lead remains for explicit reopen.

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
  v_event_type text;
  v_prev_lost_reason text;
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

    v_prev_lost_reason := v_existing.lost_reason;
    v_event_type := CASE
      WHEN v_existing.status = 'lost' THEN 'reopened_merge'
      ELSE 'merged'
    END;

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
      status = CASE
        WHEN v_existing.status = 'lost' THEN 'new'
        ELSE status
      END,
      lost_reason = CASE
        WHEN v_existing.status = 'lost' THEN NULL
        ELSE lost_reason
      END,
      updated_at = now()
    WHERE id = v_existing.id;

    INSERT INTO public.lead_events (lead_id, brand_id, event_type, payload, created_by)
    VALUES (
      v_existing.id,
      p_brand_id,
      v_event_type,
      p_payload || jsonb_build_object(
        'prior_status', v_existing.status,
        'previous_lost_reason', v_prev_lost_reason
      ),
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
