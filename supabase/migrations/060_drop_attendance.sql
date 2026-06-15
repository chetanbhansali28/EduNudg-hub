-- Remove center attendance sessions/records and related analytics fields.

DROP POLICY IF EXISTS attendance_center ON public.attendance_sessions;
DROP POLICY IF EXISTS attendance_records_center ON public.attendance_records;

DROP TRIGGER IF EXISTS attendance_records_audit ON public.attendance_records;
DROP TRIGGER IF EXISTS attendance_sessions_audit ON public.attendance_sessions;

DROP TABLE IF EXISTS public.attendance_records;
DROP TABLE IF EXISTS public.attendance_sessions;

ALTER TABLE public.analytics_daily_center
  DROP COLUMN IF EXISTS attendance_rate;

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

REVOKE ALL ON FUNCTION public.get_center_ops_report(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_center_ops_report(uuid) TO authenticated;
