# Modular architecture (mandatory for agents)

Copy to `.cursor/rules/modular-features.mdc` when implementing (plan-mode may block rule file edits).

## Base theme (`@edunudg/ui`)

- Shared components, shell, form fields, and `ed-*` CSS tokens live in **`packages/ui`**.
- App features compose ui primitives — do not duplicate form/card markup per screen.
- See [`docs/spec/ui-shell-standards.md`](../spec/ui-shell-standards.md).

## One feature → dedicated module

- New capability = new folder `apps/web/src/features/<portal>/<featureName>/`.
- **Do not** extend unrelated pages (e.g. avoid adding billing into `BrandSettingsPage.tsx`).
- `AppRoutes.tsx` only adds an import + route line.

## Service layer (`apps/web/src/services/`)

| Service | Path | Examples |
|---------|------|----------|
| Database / RPC | `*Api.ts` per feature or `services/database/` | Lead APIs, brand signup |
| Auth | `services/auth/` | Email, Google OAuth |
| Payments | `services/payments/` | Brand subscription → platform |
| Integrations | `services/integrations/<vendor>/` | WhatsApp, email |

Components call services — not raw Supabase/OAuth/payment SDKs inline.

## Feature flags

- Every module and integration has an ON/OFF flag — see [`docs/spec/feature-flags.md`](../spec/feature-flags.md).
- Default new integrations to **off**.
- Gate nav, routes, and sensitive RPCs.

## Skill

`.cursor/skills/edunudg-modular-features/SKILL.md`

## Specs

- [`docs/spec/services-layer.md`](../spec/services-layer.md)
