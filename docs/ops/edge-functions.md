# Deploy Edge Functions to Supabase Cloud

EduNudg functions live in [`supabase/functions/`](../../supabase/functions/):

| Function | Purpose |
|----------|---------|
| `whatsapp-otp` | Send/verify WhatsApp OTP (stub — wire Twilio/Gupshup later) |
| `passkey-verify` | WebAuthn verify (stub — wire `@simplewebauthn/server` later) |
| `brand-owner-credentials` | Platform admin: create/update brand owner Auth user + membership |
| `platform-portal-handoff` | Platform admin: one-time `hashed_token` for cross-host `/auth/handoff` sign-in |

No Docker required. Deploy with the **Supabase CLI** against your linked cloud project.

## Prerequisites

1. [Supabase CLI](https://supabase.com/docs/guides/cli) installed (`brew install supabase/tap/supabase` on macOS)
2. Logged in and project linked (same as database setup):

```bash
cd /path/to/Abacus_franchise
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

`YOUR_PROJECT_REF` is the ID in your project URL, e.g. `https://vwfhcfxnbtpfcvbuebll.supabase.co` → `vwfhcfxnbtpfcvbuebll`.

## Deploy one function

```bash
supabase functions deploy whatsapp-otp
supabase functions deploy passkey-verify
supabase functions deploy platform-portal-handoff
supabase functions deploy brand-owner-credentials
```

## Deploy all functions

```bash
supabase functions deploy
```

CLI bundles each folder under `supabase/functions/<name>/` and uploads to your project.

## Verify deployment

**Dashboard:** Project → **Edge Functions** — you should see `whatsapp-otp` and `passkey-verify`.

**HTTP test** (replace `YOUR_REF` and `YOUR_ANON_KEY` from Dashboard → API):

```bash
curl -i --request POST \
  'https://YOUR_REF.supabase.co/functions/v1/whatsapp-otp' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"phone":"+919876543210"}'
```

Expected stub response: `{"ok":true,"message":"OTP stub — configure WhatsApp provider"}`

Passkey stub:

```bash
curl -i --request POST \
  'https://YOUR_REF.supabase.co/functions/v1/passkey-verify' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{}'
```

## Secrets (when you integrate real providers)

Set secrets in the cloud project (not in git):

```bash
supabase secrets set TWILIO_ACCOUNT_SID=your_sid
supabase secrets set TWILIO_AUTH_TOKEN=your_token
supabase secrets set TWILIO_VERIFY_SERVICE_SID=your_verify_sid
```

List secrets:

```bash
supabase secrets list
```

Redeploy after changing secrets:

```bash
supabase functions deploy whatsapp-otp
```

Access in function code: `Deno.env.get("TWILIO_ACCOUNT_SID")`

## Call from the React app

```typescript
const { data, error } = await supabase.functions.invoke("whatsapp-otp", {
  body: { phone: "+919876543210" },
});
```

`invoke` sends the user's session JWT automatically when logged in.

## Optional flags

| Flag | When to use |
|------|-------------|
| `--no-verify-jwt` | Public webhook only (avoid for OTP/passkey in production) |
| `--project-ref YOUR_REF` | Skip link; pass project explicitly |

Example (public webhook — not recommended for EduNudg auth flows):

```bash
supabase functions deploy whatsapp-otp --no-verify-jwt
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Cannot find project ref` | Run `supabase link --project-ref ...` from repo root |
| `Docker daemon` error | Use `functions deploy` only — do **not** use `supabase start` |
| 401 on curl | Add `Authorization: Bearer <anon_key>` or user JWT |
| Function not updating | Redeploy; check correct project in Dashboard |

## Related

- [supabase-cloud-setup.md](./supabase-cloud-setup.md) — database + env
- [platform-admin-portal-handoff.md](./platform-admin-portal-handoff.md) — cross-portal support login
- [auth-providers.md](../architecture/auth-providers.md) — auth design
