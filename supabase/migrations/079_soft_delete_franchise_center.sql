-- Brand/platform soft-delete a franchise center (hides from lists and public landing).

CREATE OR REPLACE FUNCTION public.soft_delete_franchise_center(
  p_center_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_id uuid;
  v_from public.center_status;
  v_reason text := nullif(trim(coalesce(p_reason, '')), '');
BEGIN
  IF p_center_id IS NULL THEN
    RAISE EXCEPTION 'center_id is required';
  END IF;

  SELECT fc.brand_id, fc.status
  INTO v_brand_id, v_from
  FROM public.franchise_centers fc
  WHERE fc.id = p_center_id AND fc.deleted_at IS NULL;

  IF v_brand_id IS NULL THEN
    RAISE EXCEPTION 'Center not found';
  END IF;

  IF NOT public.has_brand_access(v_brand_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.franchise_centers
  SET
    deleted_at = now(),
    status = 'closed',
    updated_at = now()
  WHERE id = p_center_id
    AND deleted_at IS NULL;

  INSERT INTO public.center_status_events (brand_id, center_id, from_status, to_status, reason, created_by)
  VALUES (v_brand_id, p_center_id, v_from, 'closed', v_reason, auth.uid());

  PERFORM public.log_platform_audit(
    'soft_delete_franchise_center',
    'franchise_center',
    p_center_id,
    v_brand_id,
    p_center_id,
    jsonb_build_object('reason', v_reason)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.soft_delete_franchise_center(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.soft_delete_franchise_center(uuid, text) TO authenticated;
