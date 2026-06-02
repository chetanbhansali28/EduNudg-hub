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

All events → `auth_audit_logs`.

OAuth redirect URLs (local dev): set in **Supabase Dashboard → Authentication → URL configuration** — Site URL `http://localhost:9000`, redirects `http://localhost:9000/**`.
