-- RLS + journey behavior: franchise student journey objects and WhatsApp merge rules
-- Run via: pnpm test:rls
-- Covers: E2E-07 / FR-X02 / FR-B15b (active merge, auto-reopen lost, reject converted)

DO $$
DECLARE
  v_brand_id uuid := 'a0000000-0000-4000-8000-000000000001';
  v_wa text := '+919900001065';
  v_lead_id uuid;
  v_lead_id2 uuid;
  v_status text;
  v_event text;
  v_notes text;
  v_err text;
BEGIN
  -- Presence checks
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'platform_brand_signups') THEN
    RAISE EXCEPTION 'Missing platform_brand_signups table';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lead_events') THEN
    RAISE EXCEPTION 'Missing lead_events table';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'submit_brand_student_application') THEN
    RAISE EXCEPTION 'Missing submit_brand_student_application';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'mark_lead_lost') THEN
    RAISE EXCEPTION 'Missing mark_lead_lost';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'reopen_lead') THEN
    RAISE EXCEPTION 'Missing reopen_lead';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'approve_platform_brand_signup') THEN
    RAISE EXCEPTION 'Missing approve_platform_brand_signup';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'approve_franchise_inquiry') THEN
    RAISE EXCEPTION 'Missing approve_franchise_inquiry';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'reject_franchise_inquiry') THEN
    RAISE EXCEPTION 'Missing reject_franchise_inquiry';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'brand_success_stories') THEN
    RAISE EXCEPTION 'Missing brand_success_stories table';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_brand_student_lead_staff') THEN
    RAISE EXCEPTION 'Missing create_brand_student_lead_staff';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_platform_brand_signup_staff') THEN
    RAISE EXCEPTION 'Missing create_platform_brand_signup_staff';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'reject_platform_brand_signup') THEN
    RAISE EXCEPTION 'Missing reject_platform_brand_signup';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'convert_lead_to_student'
      AND pg_get_function_arguments(p.oid) LIKE '%jsonb%'
  ) THEN
    RAISE EXCEPTION 'Missing convert_lead_to_student with overrides';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'count_stale_brand_leads') THEN
    RAISE EXCEPTION 'Missing count_stale_brand_leads';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_lead_stale') THEN
    RAISE EXCEPTION 'Missing is_lead_stale';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'upsert_lead_by_whatsapp') THEN
    RAISE EXCEPTION 'Missing upsert_lead_by_whatsapp';
  END IF;

  -- Skip behavioral merge asserts when seed brand is absent (local without test-users)
  IF NOT EXISTS (SELECT 1 FROM public.brands WHERE id = v_brand_id) THEN
    RAISE NOTICE 'RLS franchise student journey smoke test passed (seed brand absent; merge asserts skipped)';
    RETURN;
  END IF;

  -- Cleanup any prior test lead for this WhatsApp
  DELETE FROM public.lead_events
  WHERE lead_id IN (SELECT id FROM public.leads WHERE brand_id = v_brand_id AND whatsapp_e164 = v_wa);
  DELETE FROM public.leads WHERE brand_id = v_brand_id AND whatsapp_e164 = v_wa;

  -- Active merge: second upsert updates same row, logs merged
  v_lead_id := public.upsert_lead_by_whatsapp(
    v_brand_id,
    v_wa,
    jsonb_build_object(
      'lead_source', 'brand',
      'parent_name', 'Merge Parent',
      'email', 'merge-parent@example.com',
      'city', 'Bengaluru',
      'pincode', '560001',
      'child_name', 'Child A',
      'notes', 'first'
    )
  );

  v_lead_id2 := public.upsert_lead_by_whatsapp(
    v_brand_id,
    v_wa,
    jsonb_build_object(
      'lead_source', 'brand',
      'parent_name', 'Merge Parent',
      'email', 'merge-parent@example.com',
      'city', 'Bengaluru',
      'pincode', '560001',
      'child_name', 'Child B',
      'notes', 'second-update'
    )
  );

  IF v_lead_id IS DISTINCT FROM v_lead_id2 THEN
    RAISE EXCEPTION 'E2E-07 active merge: expected same lead id, got % vs %', v_lead_id, v_lead_id2;
  END IF;

  SELECT notes INTO v_notes FROM public.leads WHERE id = v_lead_id;
  IF v_notes IS DISTINCT FROM 'second-update' THEN
    RAISE EXCEPTION 'E2E-07 active merge: notes not updated, got %', v_notes;
  END IF;

  SELECT event_type INTO v_event
  FROM public.lead_events
  WHERE lead_id = v_lead_id AND event_type = 'merged'
  ORDER BY created_at DESC
  LIMIT 1;
  IF v_event IS NULL THEN
    RAISE EXCEPTION 'E2E-07 active merge: missing merged lead_event';
  END IF;

  -- Lost auto-reopen: status returns to new; reopened_merge event; prior reason in payload
  UPDATE public.leads
  SET status = 'lost', lost_reason = 'Not interested', updated_at = now()
  WHERE id = v_lead_id;

  v_lead_id2 := public.upsert_lead_by_whatsapp(
    v_brand_id,
    v_wa,
    jsonb_build_object(
      'lead_source', 'brand',
      'parent_name', 'Merge Parent',
      'email', 'merge-parent@example.com',
      'city', 'Bengaluru',
      'pincode', '560001',
      'child_name', 'Child C',
      'notes', 'reapply-after-lost'
    )
  );

  IF v_lead_id IS DISTINCT FROM v_lead_id2 THEN
    RAISE EXCEPTION 'E2E-07 lost auto-reopen: expected same lead id';
  END IF;

  SELECT status, lost_reason INTO v_status, v_notes FROM public.leads WHERE id = v_lead_id;
  IF v_status IS DISTINCT FROM 'new' THEN
    RAISE EXCEPTION 'E2E-07 lost auto-reopen: expected status new, got %', v_status;
  END IF;
  IF v_notes IS NOT NULL THEN
    RAISE EXCEPTION 'E2E-07 lost auto-reopen: expected lost_reason cleared, got %', v_notes;
  END IF;

  SELECT event_type INTO v_event
  FROM public.lead_events
  WHERE lead_id = v_lead_id AND event_type = 'reopened_merge'
  ORDER BY created_at DESC
  LIMIT 1;
  IF v_event IS NULL THEN
    RAISE EXCEPTION 'E2E-07 lost auto-reopen: missing reopened_merge event';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.lead_events
    WHERE lead_id = v_lead_id
      AND event_type = 'reopened_merge'
      AND payload ->> 'previous_lost_reason' = 'Not interested'
  ) THEN
    RAISE EXCEPTION 'E2E-07 lost auto-reopen: previous_lost_reason not preserved in event payload';
  END IF;

  -- Converted reject: no second row; exception
  UPDATE public.leads SET status = 'converted', updated_at = now() WHERE id = v_lead_id;
  v_err := NULL;
  BEGIN
    PERFORM public.upsert_lead_by_whatsapp(
      v_brand_id,
      v_wa,
      jsonb_build_object(
        'lead_source', 'brand',
        'parent_name', 'Merge Parent',
        'email', 'merge-parent@example.com',
        'city', 'Bengaluru',
        'pincode', '560001',
        'notes', 'should-fail'
      )
    );
  EXCEPTION WHEN OTHERS THEN
    v_err := SQLERRM;
  END;
  IF v_err IS NULL OR v_err NOT ILIKE '%already enrolled%' THEN
    RAISE EXCEPTION 'E2E-07 converted reject: expected already enrolled error, got %', coalesce(v_err, 'NULL');
  END IF;

  IF (SELECT count(*) FROM public.leads WHERE brand_id = v_brand_id AND whatsapp_e164 = v_wa) <> 1 THEN
    RAISE EXCEPTION 'E2E-07 converted reject: expected exactly one lead row';
  END IF;

  -- Cleanup
  DELETE FROM public.lead_events WHERE lead_id = v_lead_id;
  DELETE FROM public.leads WHERE id = v_lead_id;

  RAISE NOTICE 'RLS franchise student journey smoke + merge behavior test passed';
END $$;
