# Feature flags

ON/OFF control for product modules and integrations. Flags must gate **nav**, **routes**, and **RPC** (server rejects when disabled for security-sensitive features).

## Storage

| Scope | Location | Example keys |
|-------|----------|----------------|
| Platform | `platform_settings.settings.features` jsonb | `platform_brand_signup`, `payment_gateway` |
| Brand | `brand_settings.settings.features` jsonb | `student_leads`, `franchise_applications`, `campaigns`, `merchandise` |
| Brand integrations | `brand_settings.settings.integrations` jsonb | `google_auth`, `whatsapp_otp`, `payment_razorpay` |
| Env fallback | `import.meta.env` | Dev overrides only — not sole source in prod |

Default for **new** keys: `false` until explicitly enabled in Settings UI or seed.

## v1 module flags (brand)

| Key | Default | When ON |
|-----|---------|---------|
| `student_leads` | true (after migration) | Student Leads nav, brand application form, lead RPCs |
| `franchise_applications` | true | Franchise Applications nav, franchise form |
| `brand_billing` | true | Settings/Billing — pay platform subscription |
| `campaigns` | false | Phase E |
| `merchandise` | false | Phase D — catalog (incl. product photos), center shop, orders, payments |

## Integration flags

| Key | Scope | Notes |
|-----|-------|-------|
| `auth_google` | brand + center | Social sign-in |
| `auth_email` | brand + center | Email/password |
| `auth_whatsapp_student` | learn | Student OTP |
| `payment_gateway` | brand | Platform subscription checkout |

## UI pattern

```typescript
// apps/web/src/hooks/useFeatureFlag.ts
export function useFeatureFlag(key: string): boolean {
  // resolve platform vs brand scope from TenantProvider
}
```

- Sidebar: omit items when flag false.
- Route: optional `FeatureFlagRoute` wrapper redirecting to `/app` if off.

## Admin UI (phased)

- Platform `/admin/settings` — platform flags + gateway credentials (secrets via env/Edge only).
- Platform `/admin/brands/:slug` — per-brand feature toggles (platform admin).
- Brand `/app/settings` — white-label, SLA, theme (feature toggles are platform-admin only).

## RPC guard

```sql
IF NOT (brand_settings.settings->'features'->>'student_leads')::boolean THEN
  RAISE EXCEPTION 'feature_disabled';
END IF;
```

## Related

- [services-layer.md](./services-layer.md)
