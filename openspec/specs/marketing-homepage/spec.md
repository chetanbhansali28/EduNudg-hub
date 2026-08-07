# marketing-homepage Specification

## Purpose

Platform public marketing chrome on the platform host (`/`) loads homepage config and legal pages without colliding with config-only React Query caches used by favicon, shell branding, and login.

## Related

- Frontend: [`docs/frontend/marketing-landing.md`](../../../docs/frontend/marketing-landing.md)
- Ops: [`docs/ops/runbook.md`](../../../docs/ops/runbook.md) — Marketing homepage & brand themes
- Footer: [`openspec/specs/marketing-footer/spec.md`](../marketing-footer/spec.md)
- Settings: [`openspec/specs/platform-settings/spec.md`](../platform-settings/spec.md)

## Requirements

### Requirement: Separate React Query keys for config vs public bundle

The SPA SHALL cache raw `HomepageConfig` separately from the public chrome bundle `{ config, legalPages }`. Sharing one key SHALL NOT be allowed.

Traceability: regression — login stuck on Loading when config-only cache poisoned the public layout.

#### Scenario: Public layout uses public-bundle key

- **WHEN** `MarketingPublicLayout` fetches marketing chrome
- **THEN** it uses `MARKETING_PUBLIC_BUNDLE_QUERY_KEY` (`["marketing-homepage", "public-bundle"]`)
- **AND** the cache value shape is `{ config, legalPages }`

#### Scenario: Favicon and editors use config-only key

- **WHEN** favicon, shell branding, or homepage editors load config
- **THEN** they use `MARKETING_HOMEPAGE_CONFIG_QUERY_KEY` (`["marketing-homepage"]`)
- **AND** the cache value is raw `HomepageConfig` (not a bundle)

#### Scenario: Keys must differ

- **GIVEN** both query keys exist in `homepageApi.ts`
- **WHEN** tests assert key identity
- **THEN** `MARKETING_PUBLIC_BUNDLE_QUERY_KEY` is not equal to `MARKETING_HOMEPAGE_CONFIG_QUERY_KEY`
- **AND** the public-bundle key shares the same root segment for invalidation grouping

### Requirement: Login survives shared marketing navigation

Navigating from the platform public homepage to `/login` SHALL NOT leave the login page stuck on Loading because of a mismatched React Query cache shape.

#### Scenario: Marketing home then login

- **WHEN** a visitor loads platform `/` then navigates to `/login`
- **THEN** the login form (Email field) becomes available
- **AND** the page is not stuck on a loading state caused by homepage query-cache collision
