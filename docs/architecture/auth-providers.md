# Auth Providers

## Google / Facebook

Supabase `signInWithOAuth({ provider: 'google' | 'facebook' })`. Link row in `auth_identities`.

## WhatsApp OTP

1. User enters `phone_e164`
2. Edge Function `whatsapp-otp` sends OTP (Twilio Verify WhatsApp / Gupshup)
3. User verifies → Supabase session
4. Rate limit via `auth_rate_limits`

## Passkeys (WebAuthn)

1. Register: `@simplewebauthn/browser` → Edge Function `passkey-register`
2. Store in `passkey_credentials`
3. Login: challenge/verify via `passkey-verify`

## Email

Staff fallback: `signInWithPassword` / magic link invites.

Post-login redirect honors `?next=` on `/login` (used after platform-admin handoff).

## Platform admin cross-portal handoff

Platform admins open brand/center/learn/parents hosts without a separate password:

1. Edge Function `platform-portal-handoff` returns `{origin}/auth/handoff?token_hash=…&next=…`
2. `AuthHandoffPage` calls `verifyOtp` on the **target host** (session is per-origin)
3. Platform `memberships` row grants access on brand/center staff routes

Does not use Supabase `action_link` redirects to subdomains. Details: [platform-admin-portal-handoff.md](../ops/platform-admin-portal-handoff.md).

All events → `auth_audit_logs`.

OAuth redirect URLs (local dev): set in **Supabase Dashboard → Authentication → URL configuration** — Site URL `http://localhost:9000` (not `3000`), redirects `http://localhost:9000/**`.
