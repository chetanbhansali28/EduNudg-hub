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

### Requirement: Legacy Novu seed discard must not drop uploaded media

`isLegacyPlatformHomepageSeed` SHALL return false when the stored row already has enterprise platform blocks or public URLs under `brand-assets`. Only virgin Novu seed (Novu theme markers without enterprise/custom media) MAY be replaced with `DEFAULT_HOMEPAGE_CONFIG` at read time.

#### Scenario: Customized row with Novu markers keeps brand-assets URLs

- **GIVEN** `platform_settings.marketing_homepage` still has `theme.bgGradient` or a Novu `themeNote`
- **AND** the row includes enterprise blocks or `brand-assets` media URLs
- **WHEN** the public homepage or `/admin/homepage` loads config
- **THEN** the client merges the stored config (including hero/logo media URLs)
- **AND** does not substitute stock Unsplash defaults

### Requirement: Brand and center landings preserve stored media

Brand and center public/editor loads SHALL merge stored `landing` / `center_landing` partials. Fallbacks SHALL pass available landing JSON. Saves SHALL preserve existing `brand-assets` URLs over stock Unsplash. Seed upserts SHALL not full-replace `brand_settings.settings`.

#### Scenario: Incomplete brand name still keeps landing media

- **GIVEN** `get_brand_landing_public` returns landing JSON with `brand-assets` URLs
- **AND** `brand_name` is missing
- **WHEN** the public brand landing loads
- **THEN** the fallback path still merges the landing partial (media URLs remain)

#### Scenario: Brand marketing save does not overwrite uploads with Unsplash

- **GIVEN** stored `landing.hero.backgroundImageUrl` points at `brand-assets`
- **AND** the editor draft contains an Unsplash default for that field
- **WHEN** `saveBrandMarketingLanding` runs
- **THEN** the stored `brand-assets` URL is kept

### Requirement: Center enrollment template has its own brand nav page

Brand staff SHALL edit the parent enrollment template (`center_landing`) at `/app/center-site` (**Center Site Configuration**). The brand Homepage editor at `/app/homepage` SHALL NOT include that Center sites panel.

#### Scenario: Homepage editor is brand site only

- **GIVEN** a brand user on `/app/homepage`
- **THEN** they see **Homepage Configuration** for the brand recruitment site
- **AND** they do not see **Center sites (parent enrollment template)** on that page

#### Scenario: Center Site Configuration is a left-nav item

- **GIVEN** a brand user in the `/app` shell
- **WHEN** they open **Center Site Configuration**
- **THEN** they land on `/app/center-site`
- **AND** they can edit the parent enrollment template
