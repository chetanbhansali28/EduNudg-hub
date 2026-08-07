# Marketing landing pages (shared base theme)

Public marketing landings share one UI kit under `apps/web/src/features/marketing/`. The same layout and CSS apply to:

| Host | Route `/` | Config source |
|------|-----------|---------------|
| Platform | `MarketingPublicLayout` | `platform_settings` key `marketing_homepage` |
| Brand | `BrandPublicLayout` | RPC `get_brand_landing_public` + `buildBrandLandingConfig` |
| Center | `CenterPublicLayout` | RPC `get_center_landing_public` + theme-aware merge (`mergeAbacusClassicCenterLandingConfig`, `mergeSparkAcademyCenterLandingConfig`, or `buildCenterLandingConfig`) |

**Platform legacy gate:** `isLegacyPlatformHomepageSeed()` only replaces the virgin Novu seed. Rows with enterprise blocks or uploaded `brand-assets` URLs are merged as-is (Novu `bgGradient` / `themeNote` alone must not discard media).

**Brand / center content safety:** public + editor paths must always merge stored `landing` / `center_landing`. Fallbacks must not drop landing JSON. Saves use `preserveCustomMarketingMediaUrls`. Seed must not full-replace `brand_settings.settings`. See rule `marketing-homepage-media` and `marketingMediaGuard.ts`.

## Brand marketing themes

Platform admins assign a theme per brand at **Platform → Brands → Edit** (`/admin/brands/:slug`) in **Brand settings** → **Website theme**. Stored on `brands.marketing_theme`.

| Theme | Layout | Editor (brand owners) |
|-------|--------|------------------------|
| `novu` (default) | Phone-scroll features, Novu nav | `HomepageEditorForm` at `/app/homepage` |
| `abacus-classic` | Success Abacus-style sections, dual CTAs, modals | `AbacusClassicEditorForm` at `/app/homepage` |
| `spark-academy` | Educat-style courses grid, mentors, journey stats | `AbacusClassicEditorForm` at `/app/homepage` |

Brand owners edit **content** at `{brand}.localhost:9000/app/homepage`. Theme selection is platform-only (brand detail **Brand settings**, not the brands list).

When a brand switches from Novu to Abacus Classic or Spark Academy, stored `landing` JSON is merged with the new theme defaults. **Novu-era section toggles do not disable Abacus/Spark sections** until the brand owner saves from the alternate-theme editor (detected via Abacus/Spark-specific fields in JSON). Shared copy (hero, FAQ, testimonials, features) is preserved. See `mergeAbacusClassicSectionVisibility()` in `homepageSections.ts`.

Brand detail (`/admin/brands/:slug`) covers performance KPIs, brand settings, domains, and franchise centers — not marketing theme.

Abacus Classic sections (in order): hero → programs grid (from brand curriculum DB) → feature grid → founders → trust/video + stat cards → success stories carousel → FAQ → photo gallery → rich footer (live center/student counts + custom stats).

Center enrollment sites (`{center}.{brand}`) inherit the brand's `marketing_theme` and show the same programs grid from brand curriculum. Center copy (hero, city) comes from `mergeAbacusClassicCenterLandingConfig()` merged with `brand_settings.center_landing`.

Program cards can be managed directly in **Marketing pages → Programs grid** (`programsSection.cards[]`). When no named homepage cards exist, the grid falls back to published curriculum programs.

## Public nav anchors (all themes)

Nav links are configured in the homepage editor (`config.nav.links`). Brand owners choose **labels** freely; hrefs must match on-page section IDs.

| Theme | Default programs link | Curriculum / programs target | Full curriculum tree |
|-------|----------------------|------------------------------|----------------------|
| `novu` | — (auto **Curriculum** when published programs exist) | `#curriculum` → `CurriculumPublicSection` | Yes |
| `abacus-classic` | **Programs** → `#programs` | **`#curriculum`** → syllabus section (`AbacusCurriculumSection`) | No (marketing grid + syllabus tree) |
| `spark-academy` | **Programs** → `#programs` | `#curriculum` alias scrolls to courses grid | No |

`syncMarketingNavLinks()` in `marketingPublicSite.ts` auto-adds **Curriculum → `#curriculum`** on Novu only when RPC returns published programs. Alternate themes keep default **Programs** links; custom `#curriculum` hrefs still work via an in-section anchor alias.

Direct URLs such as `/#curriculum` scroll after the landing bundle loads (`scrollToMarketingHash` in `BrandPublicLayout` / `CenterPublicLayout`).

### Homepage editor nav Link dropdown

In **Navigation & CTAs** (Abacus/Spark) or **Navigation Management** (Novu), each menu item **Link** field is a theme-aware dropdown plus optional **Custom link** text input. Presets match on-page section IDs above; Novu brand vs center templates differ (`#apply` vs `#register`). Helpers live in `marketingNavSectionOptions()` / `NavLinkHrefField` (`HomepageEditorShell.tsx`). Legacy mistyped anchors such as `#FoundersSection` normalize to `#founders` when saved.

**Abacus Classic syllabus:** Toggle **Curriculum syllabus** in the homepage editor (visible by default). Content comes from published `/app/curriculum` data; no separate copy fields in v1.

See [Abacus Classic theme](./abacus-classic.md) for Sprint 1–3 scope, component map, automated tests, and manual QA checklists.

See [Spark Academy theme](./spark-academy.md) for Educat-style sections and shared lead-modal deep links.

See `apps/web/src/features/marketing/abacus-classic/` and `apps/web/src/features/marketing/spark-academy/`.

## Platform React Query keys (do not collapse)

| Key constant | Value | Consumers | Cache shape |
|--------------|-------|-----------|-------------|
| `MARKETING_HOMEPAGE_CONFIG_QUERY_KEY` | `["marketing-homepage"]` | Favicon, shell branding, editors | `HomepageConfig` |
| `MARKETING_PUBLIC_BUNDLE_QUERY_KEY` | `["marketing-homepage", "public-bundle"]` | `MarketingPublicLayout` | `{ config, legalPages }` |

Sharing one key caused login to stick on **Loading…** after visiting the public homepage. Spec: [`openspec/specs/marketing-homepage/spec.md`](../../openspec/specs/marketing-homepage/spec.md).

## Lead modals (Abacus / Spark)

Deep links `#enroll`, `#enroll-student`, `#register` → enroll modal; `#apply` → franchise modal. Center Path B passes `centerSlug` so enroll submits `submit_center_student_registration`. See [spark-academy.md](./spark-academy.md) and [abacus-classic.md](./abacus-classic.md).

Staff apps live under `/login` (public) and `/app` (authenticated) for brand and center portals.

Admin portal styling (Vivid Logic): shared shell, dark mode toggle, uniform two-column homepage editor UX (`EditorFieldsGrid`, card panels, primary/danger buttons), and center detail layout — see [Vivid Logic admin UX](./vivid-logic-admin.md).

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

Brand and center marketing editors (**Feature sections (phone blocks)**) support **any number of blocks** (minimum 1 when the section is enabled). Removing extra blocks no longer breaks the public site.

### Desktop (≥1024px)

- Tall scroll region (`min-height: N × 100svh`, `N` = block count) with sticky center phone.
- Copy in left/right columns advances with scroll progress (first half of blocks left, remainder right).
- Section videos from `HomepageConfig.featureSections[].videoUrl`.

### Mobile / tablet (&lt;1024px)

- **One feature per viewport**: each `.novu-features-stack__item` is `min-height: 100dvh` with `scroll-snap-align: start` on `html:has(.marketing-page)`.
- Each screen = **centered phone stage** + copy block (no separate carousel).
- Brand/center landings merge default demo videos via `withDefaultFeatureVideos()` when URLs are omitted.

## CTAs

- Shared component: `MarketingCtaLink.tsx` (stagger label + optional Apple icon).
- Nav: no icon. Hero and footer: icon on dark surfaces (`on-dark` white button).

## Related code

- `apps/web/src/lib/marketingFeatureSections.ts` — default phone videos; Abacus program marquee palette
- `apps/web/src/types/homepage.ts` — `HomepageConfig` including `meta.logoUrl`
- `apps/web/src/features/platform/BrandEditForm.tsx` — **Website theme** in brand settings on `/admin/brands/:slug`
- `apps/web/src/features/platform/HomepageEditorPage.tsx` — `/admin/homepage`
- `apps/web/src/routes/AppRoutes.tsx` — public `/` vs staff `/app`; `/auth/handoff` on all portal hosts

## Local URLs

See [Operations runbook](../ops/runbook.md#urls-port-9000).
