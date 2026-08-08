# Auth Providers

## Google / Facebook

Supabase `signInWithOAuth({ provider: 'google' | 'facebook' })`. Link row in `auth_identities`.

## WhatsApp OTP

1. User enters `phone_e164`
2. Edge Function `whatsapp-otp` sends OTP (Twilio Verify WhatsApp / Gupshup)
3. User verifies → Supabase session
4. Rate limit via `auth_rate_limits`

## Passkeys (WebAuthn)

1. **Register** (while signed in): Settings → **Passkeys** → **Add passkey on this device** — works on desktop (Touch ID / Windows Hello) and mobile (Face ID / fingerprint) over HTTPS.
2. Store credential in `passkey_credentials` via Edge Function `passkey-verify` (`register-options` / `register-verify`).
3. **Login**: `/login` **Log in with passkey** → `passkeyService` → `passkey-verify` (`login-options` / `login-verify`) → `verifyOtp` session.
4. Deploy after schema push:

```bash
pnpm dlx supabase@2.104.0 db push
pnpm dlx supabase@2.104.0 functions deploy passkey-verify
```

RP ID: `localhost` for `*.localhost` dev hosts; production hostname (e.g. `edunudg-hub.vercel.app`) for Vercel. Add production origin to Supabase Auth redirect URLs.

## Email

Staff fallback: `signInWithPassword` / magic link invites.

Post-login redirect honors `?next=` on `/login` (used after platform-admin handoff).

OAuth staff sign-in (`signInWithOAuth`) redirects to `{origin}/login` so membership checks run before `/admin` or `/app`. Legacy returns to `/` with `#access_token` are forwarded to `/login` by `OAuthReturnRedirect`.

## Platform admin cross-portal handoff

Platform admins open brand/center/learn/parents hosts without a separate password:

1. Edge Function `platform-portal-handoff` returns `{origin}/auth/handoff?token_hash=…&next=…`
2. `AuthHandoffPage` calls `verifyOtp` on the **target host** (session is per-origin)
3. Platform `memberships` row grants access on brand/center staff routes

Does not use Supabase `action_link` redirects to subdomains. Details: [platform-admin-portal-handoff.md](../ops/platform-admin-portal-handoff.md).

All events → `auth_audit_logs`.

OAuth redirect URLs (local dev): set in **Supabase Dashboard → Authentication → URL configuration** — Site URL `http://localhost:9000` (not `3000`), redirects `http://localhost:9000/**`.
