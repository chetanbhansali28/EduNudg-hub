## 1. Types & helpers

- [x] 1.1 Add `HomepageAbout*` types on `HomepageConfig.about`
- [x] 1.2 Add `about` to `HomepageSectionKey` + theme defaults (`false` for homepage)
- [x] 1.3 Add `aboutUs.ts` helpers (empty section/member/feature, `aboutHasContent`, `isAboutPagePublished`)
- [x] 1.4 Extend `marketingMediaGuard` for about image + member photos
- [x] 1.5 Serialize `about` in `landingConfigToPartial` and merge in brand landing defaults

## 2. Editor

- [x] 2.1 Build `AboutUsEditorFields` (story, philosophy, features list, team list + photos, publishPage checkbox)
- [x] 2.2 Wire section accordion into Novu + Abacus/Spark homepage editors
- [x] 2.3 Add nav presets `/about` and `#about` in `marketingPublicSite`

## 3. Public UI

- [x] 3.1 Build Mastermind-style `AboutUsPageContent` + CSS (team grid)
- [x] 3.2 Add `BrandAboutPage` + `/about` route under `BrandPublicLayout`
- [x] 3.3 Add homepage `AboutUsSection` (`#about`) in Novu / Abacus / Spark content
- [x] 3.4 Redirect unpublished/empty `/about` to `/`

## 4. Tests & docs

- [x] 4.1 Vitest: helpers, media guard, editor serialization, public render / redirect
- [x] 4.2 Update `docs/frontend/marketing-landing.md` + main OpenSpec `brand-about-us` via sync
- [x] 4.3 Run targeted Vitest for changed files
