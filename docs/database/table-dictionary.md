# Table Dictionary

## Audit columns (mutable tables)

All mutable business tables: `created_at`, `updated_at`, `created_by`, `updated_by` + `set_row_audit()` trigger.

## Append-only (no updated_by)

| Table | Notes |
|-------|-------|
| `financial_events` | `created_by` only |
| `platform_audit_logs` | `created_by` only |
| `enrollment_history` | `created_by` only |
| `brand_status_events` | `created_by` only |
| `auth_audit_logs` | `created_by` only |

## Core

| Table | Scope | Description |
|-------|-------|-------------|
| `profiles` | user | Extended auth user profile |
| `brands` | platform | Franchise brand tenant |
| `franchise_centers` | brand | Physical center |
| `memberships` | auth | User role per scope |
| `domain_mappings` | routing | Hostname → portal |

## Auth

| Table | Description |
|-------|-------------|
| `auth_identities` | Linked OAuth / WhatsApp / passkey |
| `passkey_credentials` | WebAuthn credentials |
| `auth_audit_logs` | Login events |
| `auth_rate_limits` | OTP rate limiting |

See migrations `000`–`011` for full schema.

## Public RPC (no table)

| Function | Description |
|----------|-------------|
| `get_portal_branding(brand_slug, center_slug)` | Anon-safe JSON for login white-label: brand/center name, logo, optional `brand_settings.settings.login_headline` / `login_subtext`. Migration `011`. |
| `get_brand_landing_public(brand_slug)` | Anon-safe brand name, logo, and `brand_settings.settings.landing` JSON for franchise marketing page. Migration `012`. |
| `submit_franchise_inquiry(...)` | Anon-safe insert into `franchise_inquiries`. Migration `012`. |

## Franchise recruitment

| Table | Scope | Description |
|-------|-------|-------------|
| `franchise_inquiries` | brand | Prospective franchisee applications from brand public landing |

Brand operators with `has_brand_access` can update/delete inquiries and mutate `analytics_daily_brand` (migration `013`).
