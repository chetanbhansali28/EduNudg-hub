# Marketing landing pages (shared base theme)

Public marketing landings share one UI kit under `apps/web/src/features/marketing/`. The same layout and CSS apply to:

| Host | Route `/` | Config source |
|------|-----------|---------------|
| Platform | `MarketingPublicLayout` | `platform_settings` key `marketing_homepage` |
| Brand | `BrandPublicLayout` | RPC `get_brand_landing_public` + `buildBrandLandingConfig` |
| Center | `CenterPublicLayout` | RPC `get_center_landing_public` + `buildCenterLandingConfig` |

Staff apps live under `/login` (public) and `/app` (authenticated) for brand and center portals.

## Components

| Piece | File | Notes |
|-------|------|--------|
| Nav | `MarketingNav.tsx` | Logo, hamburger dropdown, CTA; theme via `useNavTheme` |
| Hero + sections | `MarketingContent.tsx` | Scroll-reveal, enrollment/franchise forms |
| Feature phone | `FeatureScrollSection.tsx` | Desktop: 3-column scroll-driven; mobile/tablet: stacked snap |
| Highlights | `HighlightsScroller.tsx` | Horizontal cards; nav buttons below carousel |
| Footer CTA | `FooterSection.tsx` | Dark band + link columns |
| Styles | `marketing.css` | All `novu-*` tokens |

## Navigation behavior

### Desktop (≥1024px)

- Nav slides in after hero headline animation (`useHeroIntroComplete`).
- Centered glass pill: section links + CTA (no Apple icon in nav).
- Theme follows content under the nav (`useNavTheme` uses `elementsFromPoint`, not sticky hero bounds).
- Over **white** content: nav bar uses black gradient + white type (`novu-nav-bar--light`).
- Logo from `config.meta.logoUrl` (brand `logo_url`); fallback initial badge.

### Mobile / tablet (&lt;1024px)

- **Two-column bar**: `[hamburger + logo + name]` left, **CTA right-aligned** (grid `1fr auto`; hidden center pill removed from layout).
- Hamburger opens a **dropdown** (not full-screen) before the logo with section links.
- CTA uses `MarketingCtaLink` with `showIcon={false}`.

## Feature section (product / phone stage)

### Desktop (≥1024px)

- Tall scroll region (`min-height: 400svh`) with sticky center phone.
- Copy in left/right columns advances with scroll progress.
- Section videos from `HomepageConfig.featureSections[].videoUrl`.

### Mobile / tablet (&lt;1024px)

- **One feature per viewport**: each `.novu-features-stack__item` is `min-height: 100dvh` with `scroll-snap-align: start` on `html:has(.marketing-page)`.
- Each screen = **centered phone stage** + copy block (no separate carousel).
- Brand/center landings merge default demo videos via `withDefaultFeatureVideos()` when URLs are omitted.

## CTAs

- Shared component: `MarketingCtaLink.tsx` (stagger label + optional Apple icon).
- Nav: no icon. Hero and footer: icon on dark surfaces (`on-dark` white button).

## Related code

- `apps/web/src/lib/marketingFeatureSections.ts` — default phone videos for brand/center
- `apps/web/src/types/homepage.ts` — `HomepageConfig` including `meta.logoUrl`
- `apps/web/src/routes/AppRoutes.tsx` — public `/` vs staff `/app`

## Local URLs

See [Operations runbook](../ops/runbook.md#urls-port-9000).
