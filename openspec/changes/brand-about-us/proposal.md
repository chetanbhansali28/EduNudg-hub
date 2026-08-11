## Why

Brand public sites need a dedicated About Us experience (company story, differentiators, team with photos) modeled on franchise education sites like Mastermind Abacus. Brands already edit homepage leadership/features, but lack a full About page and an optional homepage About block.

## What Changes

- Add editable **About Us** content on brand marketing (`brand_settings.settings.landing.about`).
- Public brand route **`/about`** (Mastermind-style: hero, story, philosophy, key features, what we do, team photo grid, dual CTA).
- Optional **homepage `#about`** section via editor toggle (`sections.about`).
- Homepage editor accordion: company fields, feature list, team members with photo upload (`brand-assets`), publish-page + show-on-homepage controls.
- Nav preset **About** → `/about` and/or `#about`.
- Brand-only (not platform; center template out of scope for v1).

## Capabilities

### New Capabilities

- `brand-about-us`: Brand About Us editor, public `/about` page, optional homepage section, media-safe saves.

### Modified Capabilities

- (none — additive to marketing landing JSON)

## Impact

- `apps/web` marketing types, editors (Novu + Abacus/Spark), public brand layout/routes, media guard, section visibility.
- Docs: `docs/frontend/marketing-landing.md`, OpenSpec main spec after archive/sync.
- Tests: Vitest for types/helpers/section + editor/public render regressions.
