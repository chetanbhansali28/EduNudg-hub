-- passkey_auth_challenges: service role only (no anon/authenticated access)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'passkey_auth_challenges'
  ) THEN
    RAISE EXCEPTION 'Missing passkey_auth_challenges table';
  END IF;

  IF has_table_privilege('anon', 'public.passkey_auth_challenges', 'SELECT') THEN
    RAISE EXCEPTION 'anon must not read passkey_auth_challenges';
  END IF;

  IF has_table_privilege('authenticated', 'public.passkey_auth_challenges', 'SELECT') THEN
    RAISE EXCEPTION 'authenticated must not read passkey_auth_challenges';
  END IF;
END $$;
