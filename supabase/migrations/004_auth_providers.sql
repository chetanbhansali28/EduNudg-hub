-- Auth: identities, passkeys, audit, rate limits

CREATE TABLE public.auth_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider public.auth_provider NOT NULL,
  provider_user_id text,
  phone_e164 text,
  linked_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE (provider, provider_user_id)
);

CREATE TRIGGER auth_identities_audit
  BEFORE INSERT OR UPDATE ON public.auth_identities
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE TABLE public.passkey_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id text NOT NULL UNIQUE,
  public_key bytea NOT NULL,
  sign_count bigint NOT NULL DEFAULT 0,
  transports text[],
  device_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE TRIGGER passkey_credentials_audit
  BEFORE INSERT OR UPDATE ON public.passkey_credentials
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE TABLE public.auth_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  event_type text NOT NULL,
  provider public.auth_provider,
  ip_address inet,
  user_agent text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE TABLE public.auth_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_e164 text NOT NULL,
  attempt_count int NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE TRIGGER auth_rate_limits_audit
  BEFORE INSERT OR UPDATE ON public.auth_rate_limits
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

ALTER TABLE public.auth_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passkey_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY auth_identities_own ON public.auth_identities FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY passkeys_own ON public.passkey_credentials FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY auth_audit_own ON public.auth_audit_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_admin());

CREATE POLICY auth_audit_insert ON public.auth_audit_logs FOR INSERT TO authenticated
  WITH CHECK (true);
