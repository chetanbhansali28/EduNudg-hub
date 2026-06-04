# Services layer

Common capabilities live outside React components as **services** — testable, swappable, feature-flagged.

## Directory layout (target)

```
apps/web/src/services/
  auth/
    authService.ts          # session, signIn email/google
    membershipService.ts    # portal membership checks
  database/
    supabaseClient.ts       # re-export getSupabase only here for app
  payments/
    paymentGateway.ts       # interface
    razorpayGateway.ts      # implementation (example)
    brandSubscriptionCheckout.ts
  integrations/
    whatsapp/
    email/
  featureFlags/
    resolveFeatureFlag.ts
```

```
packages/ui/                  # base theme — not business logic
  src/styles.css              # tokens, ed-* layout
  src/components.tsx
  src/shell.tsx
```

```
apps/web/src/features/
  brand/studentLeads/         # one feature = one folder
  brand/franchiseApplications/
  brand/billing/
  platform/brandSignups/
```

## Database interaction

| Do | Don't |
|----|--------|
| `features/foo/fooApi.ts` calls `.rpc('submit_…')` | 50-line `mutationFn` inline in page |
| Shared `supabaseResult` helpers | Duplicate error parsing |

Server remains source of truth: **RPC + RLS** for mutations.

## Auth / social sign-in

- `authService.signInWithGoogle()`, `signInWithEmail()` — wrap Supabase Auth.
- Login page imports auth service only.
- OAuth client IDs from env; enabled per `integrations.auth_google` flag.

## Payment gateway (brand → platform subscription)

| Piece | Responsibility |
|-------|----------------|
| `paymentGateway.ts` | `createCheckoutSession`, `handleWebhookEvent` interface |
| `brandSubscriptionCheckout.ts` | Brand portal: start pay for `brand_subscriptions` / `platform_invoices` |
| Edge Function `payment-webhook` | Verify signature, call RPC `record_platform_payment` |
| RPC `record_platform_payment` | Mark invoice paid, extend subscription period |

**Payer:** brand (franchise never uses this flow).

**UI:** `/app/billing` under brand portal (flag `brand_billing`).

## Other integrations

Each vendor: `services/integrations/<vendor>/client.ts` + flag + optional Edge Function.

## Testing

- Mock services in Vitest, not Supabase in component tests.
- Contract tests for RPC names in `*Api.test.ts`.

## Related

- [feature-flags.md](./feature-flags.md)
- [technical-architecture.md](./technical-architecture.md)
