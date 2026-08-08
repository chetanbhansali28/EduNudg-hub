-- Short-lived WebAuthn challenges for passkey-verify Edge Function (service role only).

CREATE TABLE public.passkey_auth_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('authentication', 'registration')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_passkey_auth_challenges_challenge
  ON public.passkey_auth_challenges (challenge);

CREATE INDEX idx_passkey_auth_challenges_expires
  ON public.passkey_auth_challenges (expires_at);

ALTER TABLE public.passkey_auth_challenges ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.passkey_auth_challenges FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.passkey_auth_challenges TO service_role;
