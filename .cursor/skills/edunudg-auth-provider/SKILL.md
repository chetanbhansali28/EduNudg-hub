---
name: edunudg-auth-provider
description: Implement or change auth — Google, Facebook, WhatsApp OTP, passkeys, email.
---

# Auth Provider

## Providers

- Google / Facebook: Supabase `signInWithOAuth`
- WhatsApp: Edge Function `whatsapp-otp` + phone OTP
- Passkey: `@simplewebauthn/browser` + Edge Function `passkey-verify`
- Email: Supabase email/password for staff

## Tables

- `auth_identities`, `passkey_credentials`, `auth_audit_logs`

## Rules

- Log events to `auth_audit_logs`
- Rate-limit OTP via `auth_rate_limits`
- Never expose service role in client

See `docs/architecture/auth-providers.md`.
