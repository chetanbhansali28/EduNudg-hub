-- EduNudg audit standard: created_by, updated_by, set_row_audit()

CREATE OR REPLACE FUNCTION public.set_row_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  NEW.updated_by := auth.uid();
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := COALESCE(NEW.created_by, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_row_audit() IS 'Sets updated_at, updated_by on UPDATE; created_by on INSERT';
