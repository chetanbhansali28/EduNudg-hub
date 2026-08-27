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

- Log events to `auth_audit_logs` via `reportAuthAudit` / RPC `log_auth_audit_event` (`login_success` session-deduped, `logout`, `login_failure`, `access_denied`). Never block login if audit fails.
- Deploy `auth-audit` so platform ops get IP + country; SPA falls back to RPC without IP.
- Rate-limit OTP via `auth_rate_limits`
- Never expose service role in client

See `docs/architecture/auth-providers.md`.
