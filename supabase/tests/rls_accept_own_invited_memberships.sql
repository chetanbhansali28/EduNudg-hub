-- Invited staff memberships are accepted by the signed-in user only.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'accept_own_invited_memberships') THEN
    RAISE EXCEPTION 'Missing accept_own_invited_memberships';
  END IF;

  IF has_function_privilege('anon', 'public.accept_own_invited_memberships()', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon must not execute accept_own_invited_memberships';
  END IF;

  IF NOT has_function_privilege('authenticated', 'public.accept_own_invited_memberships()', 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated must execute accept_own_invited_memberships';
  END IF;
END $$;
