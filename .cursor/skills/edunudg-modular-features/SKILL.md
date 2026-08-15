---
name: edunudg-modular-features
description: Add EduNudg features using modular files, service layer, base theme, and feature flags. Use for any new screen, integration, or payment flow.
---

# Modular features

## Before coding

1. Read [`docs/spec/services-layer.md`](../../docs/spec/services-layer.md) and [`docs/spec/feature-flags.md`](../../docs/spec/feature-flags.md).
2. Read [ui-shell-standards.md](../../docs/spec/ui-shell-standards.md) for layout grid.

## Checklist

### Structure

- [ ] New feature folder under `apps/web/src/features/<portal>/<featureName>/` — **do not** bolt onto unrelated pages.
- [ ] Route wires only via `AppRoutes.tsx` import + path.
- [ ] Colocated `*.test.ts(x)`.

### Theme

- [ ] Uses `@edunudg/ui` (`Card`, `Input`, `Button`, shell) — no one-off form markup unless extending ui package.
- [ ] Responsive 3/2/1 column per ui-shell standards.

### Services

- [ ] Supabase/RPC calls in `*Api.ts` or `services/` — not inside JSX event handlers beyond one-liner delegation.
- [ ] Auth/social login via `services/auth/`.
- [ ] Payments via `services/payments/` gateway interface.
- [ ] Third-party APIs only under `services/integrations/<vendor>/`.

### Feature flags

- [ ] Add flag key to spec doc + `brand_settings.settings.features` or platform settings.
- [ ] Nav item gated with `useFeatureFlag('key')`.
- [ ] Default **off** for new integrations.

### Backend

- [ ] Public/critical mutations via RPC (tenant-safe).
- [ ] RLS on new tables; tests in `supabase/tests/`.

## Anti-patterns

- 300+ line page files mixing unrelated flows
- `getSupabase().from(...)` directly in five components for the same table
- Shipping integration without OFF switch
- Payment provider SDK imported in random feature folders

## Marketing themes (Abacus / Spark)

- Theme assigned by platform admin on brand detail (`brands.marketing_theme`).
- Abacus/Spark public CTAs use **modals** (`MarketingLeadModals` + `LeadModalHashOpener`), not Novu inline forms.
- Deep links: `#enroll` / `#enroll-student` / `#register` → enroll; `#apply` → franchise (brand only).
- Docs: `docs/frontend/abacus-classic.md`, `docs/frontend/spark-academy.md`.

## Platform homepage (`/admin/homepage`)

- Config JSON is source of truth; Storage `brand-assets` only holds files.
- **Never** discard stored media when migrating defaults — rule `marketing-homepage-media`.
- `isLegacyPlatformHomepageSeed`: enterprise blocks / `brand-assets` URLs win over Novu markers.
- Do not Save the editor while it is showing Unsplash/stock defaults over a customized DB row.

## Brand / franchise / student marketing

- Brand: `brand_settings.settings.landing` — always merge; fallbacks must pass `landing` partial.
- Center/franchise: `center_landing` (else brand `landing`) — same preserve rules.
- Saves: `preserveCustomMarketingMediaUrls` so stock Unsplash cannot overwrite uploads.
- Seed: `ON CONFLICT` must use `EXCLUDED.settings || brand_settings.settings` (existing wins).
- Student/login chrome: never clear `logo_url` / login copy when patching unrelated settings.
- Helpers: `apps/web/src/lib/marketingMediaGuard.ts`.
- Social Media Connect: Facebook/Instagram footer icons only — do **not** mount a WhatsApp float on public brand landing.
- Center public landing: never inherit brand **Apply franchise** / `#apply` secondary CTAs — `sanitizeCenterPublicNavConfig` + center merge omit them.
- Center public footer: use `franchise_centers.social_links` via `socialConnectFromCenterLinks` — Facebook, Instagram, YouTube, WhatsApp, LinkedIn, X as footer icons; never brand `social_connect`; do **not** mount a WhatsApp float.
- Center public contact: pass `centerContact={centerFooterContactFromProfile(profile)}` into Novu / Abacus / Spark footers so Location & Contact is the same overlay; never print brand `headOffice` or Spark placeholder phone on a center host.
- Center public name: `overlayCenterLandingIdentity` replaces editor placeholder `Sample Center` with Franchise Identity display/name; do not show Sample Center on View Frontend.
- Center public nav: pass `brandSlug` so Student Login shows **and** the `--franchise` lockup enlarges/highlights logo + site name (`regression_franchise_frontend_nav_highlights_logo_and_name`).
- Upcoming events: homepage section (`upcomingEvents`) like founders — optional image, date/time/duration, maxItems; public shows only upcoming; all marketing themes.
- About Us (brand only): `landing.about` + optional `sections.about`; public `/about`; Mastermind-style team photo grid; media via `preserveCustomMarketingMediaUrls`.

## Lead lost (reference)

- **Only center** marks lead `lost` (`mark_lead_lost` + `lost_reason`).
- **Brand reopens** via `reopen_lead`, or WhatsApp re-apply **auto-reopens** lost leads — see FR-B15 / FR-B15b / FR-C11b.
- Brand **Billing** uses `services/payments/` — brand pays platform subscription only.

## Manual leads (staff)

- Platform / brand / center manual entry — [`docs/spec/manual-leads.md`](../../docs/spec/manual-leads.md), `manualLeadsApi.ts`, RPCs in migration `019_*`.
- Brand Franchise Applications: **Add Franchise** uses a modal dialog, not an below-the-fold `AddFormSection`.
- Brand Student Leads / Center Leads: **Add lead** uses the same modal pattern (`ManualStudentLeadCard` + `ed-import-dialog`), not `AddFormSection`.
- App pages use `PageGrid` / `FormGrid` from `@edunudg/ui` — see [`ui-shell-standards.md`](../../docs/spec/ui-shell-standards.md).

## Before finish

- [ ] Run **`edunudg-sync-artifacts`** — OpenSpec, docs, tests, skills/rules, agent briefs as applicable
- [ ] Stay inside Frontend role fences (`agent-boundaries`); escalate schema to Database
