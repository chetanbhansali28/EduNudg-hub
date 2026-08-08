-- Align passkey_auth_challenges with audit standard when 075 was applied before audit columns existed.

ALTER TABLE public.passkey_auth_challenges
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

DROP TRIGGER IF EXISTS passkey_auth_challenges_audit ON public.passkey_auth_challenges;
CREATE TRIGGER passkey_auth_challenges_audit
  BEFORE INSERT OR UPDATE ON public.passkey_auth_challenges
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();
