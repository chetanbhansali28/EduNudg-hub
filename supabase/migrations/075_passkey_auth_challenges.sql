-- Short-lived WebAuthn challenges for passkey-verify Edge Function (service role only).

CREATE TABLE public.passkey_auth_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('authentication', 'registration')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE UNIQUE INDEX idx_passkey_auth_challenges_challenge
  ON public.passkey_auth_challenges (challenge);

CREATE INDEX idx_passkey_auth_challenges_expires
  ON public.passkey_auth_challenges (expires_at);

CREATE TRIGGER passkey_auth_challenges_audit
  BEFORE INSERT OR UPDATE ON public.passkey_auth_challenges
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

ALTER TABLE public.passkey_auth_challenges ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.passkey_auth_challenges FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.passkey_auth_challenges TO service_role;
