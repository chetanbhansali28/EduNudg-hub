-- First successful staff sign-in accepts invited memberships (brand owners from
-- platform signup approval, franchise owners from inquiry/CSV). Those rows start
-- as invited, which looked like "logged in then immediately logged out".
-- Learn/parents login does not use staff memberships.

CREATE OR REPLACE FUNCTION public.accept_own_invited_memberships()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN 0;
  END IF;

  UPDATE public.memberships
  SET
    status = 'active',
    accepted_at = coalesce(accepted_at, now()),
    updated_at = now()
  WHERE user_id = auth.uid()
    AND status = 'invited';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_own_invited_memberships() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_own_invited_memberships() TO authenticated;
