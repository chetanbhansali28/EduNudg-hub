# Abacus Classic marketing theme

Success Abacus–style public brand sites (`marketing_theme = 'abacus-classic'`). Reference layout: [Success Abacus](https://successabacus.com).

Platform admins assign the theme at **Platform → Homepage** (`/admin/homepage`) → **Brand marketing themes**. Brand owners edit copy and media at `{brand}.localhost:9000/app/homepage` via `AbacusClassicEditorForm`. Editor uses the shared Vivid Logic accordion system (`HomepageEditorShell.tsx`) — icon tiles, single-open sections, hero save card. See [Vivid Logic admin UX](./vivid-logic-admin.md).

Local demo brand: `smart-brain-abacus.localhost:9000` (see [Operations runbook](../ops/runbook.md#urls-port-9000)).

## Sprint 1 (delivered)

Sprint 1 establishes the **theme infrastructure** — database column, RPC payload, platform admin control, and layout routing.

| # | Feature | Where |
|---|---------|--------|
| 1 | `brands.marketing_theme` column + check constraint | `supabase/migrations/039_brand_marketing_theme.sql` |
| 2 | Live center/student counts for footer | `brand_public_stats_json()` in migration 039 |
| 3 | Public RPC returns theme + stats + curriculum | `get_brand_landing_public` (migration 039) |
| 4 | `MarketingTheme` type + `parseMarketingTheme()` | `apps/web/src/types/homepage.ts` |
| 5 | Bundle includes `marketingTheme` + `publicStats` | `brandLandingApi.ts`, `brandLandingBundle.ts` |
| 6 | Platform admin theme selector | `/admin/homepage` → `BrandMarketingThemesPanel` |
| 7 | Theme-aware public layout | `BrandPublicLayout` → Novu vs Abacus nav/footer |
| 8 | Theme-aware landing route | `BrandLandingPage` → `MarketingContent` vs `AbacusClassicContent` |
| 9 | Theme-aware brand editor | `BrandMarketingEditorPage` → `HomepageEditorForm` vs `AbacusClassicEditorForm` |

### Setup (Sprint 1)

```bash
supabase db push          # applies migration 039
psql $DATABASE_URL -f supabase/seed/seed.sql   # optional: smart-brain-abacus demo brand
```

Add to hosts file:

```
127.0.0.1 smart-brain-abacus.localhost
```

Assign theme: **Platform admin** → **Homepage** (`/admin/homepage`) → **Brand marketing themes** → choose *Abacus Classic* for the brand → **Save**.

Brand owners cannot change the theme; they only edit content at `{brand}.localhost:9000/app/homepage`.

## Sprint 2 (delivered)

Sprint 2 covers the top-of-page conversion flow and curriculum-driven programs strip.

| # | Feature | Component | Config / data |
|---|---------|-----------|---------------|
| 1 | Sticky nav with dual CTAs | `AbacusClassicNav` | `config.nav.ctaLabel/Href`, `secondaryCtaLabel/Href` |
| 2 | Hero with badge + dual CTAs | `AbacusClassicHero` | `config.hero.*` |
| 3 | Enroll + franchise lead modals | `MarketingLeadModals`, `AbacusCtaButton` | Hrefs `enroll` / `apply` open modals; other hrefs render anchors |
| 4 | Programs card grid + Know More modal | `ProgramsGridSection` (`ProgramsMarqueeSection.tsx`) | `publicCurriculum` + `config.programsSection`; section toggle `programsGrid` |
| 5 | Why-us feature grid (4 blocks) | `FeatureGridSection` | `config.featureSections`; heading uses `Why {siteName}` |
| 6 | Smart Brain default copy | `mergeAbacusClassicLandingConfig()` | Seed + editor defaults in `brandLandingDefaults.ts` |

Section order on the public page (`AbacusClassicContent`):

1. Hero → 2. Programs → 3. Feature grid → 4. Founders → 5. Trust / video → 6. Testimonials → 7. FAQ → 8. Gallery → 9. Rich footer (in `BrandPublicLayout`)

Section toggles live in `config.sections` and are edited in `AbacusClassicEditorForm`.

## Sprint 3 (delivered)

Sprint 3 covers social proof, media, gallery, and the rich footer with live database stats.

| # | Feature | Component | Config / data |
|---|---------|-----------|---------------|
| 1 | Multiple founder profiles | `FoundersSection` | `config.founders[]` — photo, role badge, stat badge, bio |
| 2 | YouTube + highlight stat cards | `TrustMediaSection` | `config.trustMedia` — `youtubeUrl`, `cards[]`, optional CTA |
| 3 | Photo gallery marquee | `GalleryMarqueeSection` | `config.gallery.images[]` — multi-upload in editor |
| 4 | Rich footer | `AbacusClassicFooter` | `config.footer.rich` + live `publicStats` from RPC |
| 5 | Live center/student counts | `AbacusClassicFooter` | `publicStats.centersCount`, `publicStats.studentsCount` |
| 6 | Custom stat badges | `AbacusClassicFooter` | `footer.rich.customStats[]` |
| 7 | Presence regions + head office | `AbacusClassicFooter` | `footer.rich.presence[]`, `headOffice`, `socialLinks` |
| 8 | Editor persistence | `landingConfigToPartial()` | Saves founders, trust, gallery, rich footer to `brand_settings` |

YouTube URLs are normalized via `toYoutubeEmbedUrl()` in `marketingPublicSite.ts`.

Toggle sections in the brand homepage editor: **Programs grid**, **Leadership profiles**, **Trust & video**, **Photo gallery**, **Footer**.

## Sprint 4 (delivered) — Programs grid & curriculum marketing

Card-based programs section (replacing the auto-scroll marquee) with curriculum-driven content and center theme inheritance.

| # | Feature | Where | Config / data |
|---|---------|-------|---------------|
| 1 | Programs card grid | `ProgramsGridSection` | Image or gradient fallback, age badge, blurb, **Know More →** |
| 2 | Program details modal | `AcModalShell` in `MarketingLeadModals.tsx` | Benefits list + scholarship banner |
| 3 | Section headings + program cards (editable) | `AbacusClassicEditorForm` → **Programs grid** | Shared `EditorFieldsGrid` / `EditorItemPanel` helpers from `HomepageEditorShell.tsx` (same UX as Novu admin editor) |
| 4 | Homepage program cards | `programsSection.cards[]` → `resolveProgramsGridItems()` | Name, image, age badge, blurb, benefits, scholarship; **Add program card** in homepage editor |
| 5 | Curriculum marketing fields (fallback) | `/app/curriculum` → `CurriculumWorkspace` | Used when no named homepage cards are configured |
| 6 | Public curriculum JSON | `brand_public_curriculum_json()` | Migration `042_program_marketing_fields.sql` |
| 7 | Center sites inherit Abacus theme | `mergeAbacusClassicCenterLandingConfig()` | Brand + center `{center}.{brand}` use Abacus layout, sections, and programs grid |
| 8 | Center template editor | `BrandMarketingEditorPage` panel 2 | `AbacusClassicEditorForm` when `marketing_theme = abacus-classic` |

**Card source priority:** If `programsSection.cards` contains at least one card with a name, those cards render on the public site. Otherwise the grid falls back to published **Curriculum** programs.

**Scholarship banner:** program-level `scholarshipHighlight` (homepage card or curriculum) overrides the brand-wide default from `programsSection.defaultScholarshipHighlight`.

**Benefits:** homepage card `benefits[]` or curriculum `marketing_benefits[]`; curriculum falls back to newline-separated `what_you_learn` if empty.

**Section toggle:** `config.sections.programsGrid` (legacy saved `programsMarquee` is mapped automatically).

Run migration:

```bash
supabase db push   # applies 042_program_marketing_fields.sql
```

## File map

| Area | Path |
|------|------|
| Layout + theme router | `apps/web/src/features/brand/BrandPublicLayout.tsx` |
| Landing route | `apps/web/src/features/brand/BrandLandingPage.tsx` |
| Main sections | `apps/web/src/features/marketing/abacus-classic/` |
| Defaults | `apps/web/src/lib/brandLandingDefaults.ts` → `mergeAbacusClassicLandingConfig` |
| Program card colors | `apps/web/src/lib/marketingFeatureSections.ts` → `programCardPalette` |
| Card source resolution | `apps/web/src/lib/programsGridItems.ts` → `resolveProgramsGridItems()` |
| Types | `apps/web/src/types/homepage.ts` |
| Platform theme admin | `apps/web/src/features/platform/BrandMarketingThemesPanel.tsx` on `/admin/homepage` |
| Migration | `supabase/migrations/039_brand_marketing_theme.sql`, `042_program_marketing_fields.sql` |
| Seed | `supabase/seed/seed.sql` (`smart-brain-abacus`) |

## Lead modal behavior

- **Enroll** (`ctaHref: "enroll"`): student demo form → `submitBrandStudentApplication`
- **Franchise** (`secondaryCtaHref: "apply"`): franchise inquiry → `submitFranchiseInquiry`
- Modal routing: `resolveLeadModalKind()` in `MarketingLeadModals.tsx`
- Provider wraps Abacus layout only: `LeadModalProvider` in `BrandPublicLayout`

## Automated tests

### Sprint 1

| Test file | Coverage |
|-----------|----------|
| `types/homepage.test.ts` | `parseMarketingTheme`, `MARKETING_THEMES` |
| `lib/brandLandingApi.test.ts` | RPC theme/stats parsing, `updateBrandMarketingTheme` |
| `lib/brandLandingBundle.test.ts` | Bundle normalization with `marketingTheme` / `publicStats` |
| `lib/brandLandingEditorApi.test.ts` | `fetchBrandMarketingEditor` Novu vs Abacus config |
| `lib/homepageSections.test.ts` | `ABACUS_CLASSIC_SECTION_DEFAULTS`, `isAbacusSectionEnabled` |
| `features/platform/HomepageEditorPage.test.tsx` | Brand marketing themes panel on homepage admin |
| `features/platform/BrandDetailPage.test.tsx` | Brand settings, domains Open, no duplicate KPIs |
| `features/brand/BrandPublicLayout.test.tsx` | Novu vs Abacus layout branch |
| `features/brand/BrandLandingPage.test.tsx` | Theme branch via outlet context |
| `features/brand/marketing/BrandMarketingEditorPage.test.tsx` | Abacus editor when theme is abacus-classic |

Run Sprint 1 tests:

```bash
pnpm --filter web test -- homepage.test brandLandingApi brandLandingBundle brandLandingEditorApi homepageSections HomepageEditorPage BrandDetailPage BrandPublicLayout BrandLandingPage BrandMarketingEditorPage
```

### Sprint 2

| Test file | Coverage |
|-----------|----------|
| `abacus-classic/AbacusClassicSprint2.test.tsx` | Nav/hero dual CTAs, modal open, programs grid + detail modal, feature grid, section order |
| `lib/programsGridItems.test.ts` | Homepage cards vs curriculum fallback |
| `lib/brandCurriculumPublic.test.ts` | Marketing fields parser, `programMarketingBenefits()` |
| `lib/centerLandingDefaults.test.ts` | `mergeAbacusClassicCenterLandingConfig` |
| `abacus-classic/MarketingLeadModals.test.ts` | `resolveLeadModalKind` href mapping |
| `lib/brandLandingDefaults.test.ts` | Abacus defaults: dual CTAs, 4 features, section toggles |
| `lib/marketingFeatureSections.test.ts` | `programCardPalette` cycling |
| `features/brand/BrandLandingPage.test.tsx` | Theme branch: `novu` vs `abacus-classic` via outlet context |

Run Sprint 2–related tests:

```bash
pnpm --filter web test -- AbacusClassicSprint2 BrandLandingPage brandLandingDefaults marketingFeatureSections MarketingLeadModals
```

### Sprint 3

| Test file | Coverage |
|-----------|----------|
| `abacus-classic/AbacusClassicSprint3.test.tsx` | Founders, trust/video, gallery, rich footer, section order + toggles |
| `lib/brandLandingDefaults.test.ts` | Sprint 3 default copy and section toggles |
| `lib/brandLandingEditorApi.test.ts` | Serializes founders/trust/gallery/rich footer to settings |
| `lib/marketingPublicSite.test.ts` | `toYoutubeEmbedUrl` for trust section |
| `features/brand/BrandPublicLayout.test.tsx` | Abacus rich footer with live stats |

Run Sprint 3 tests:

```bash
pnpm --filter web test -- AbacusClassicSprint3 brandLandingDefaults brandLandingEditorApi marketingPublicSite BrandPublicLayout
```

## Manual QA checklist (Sprint 1)

Prerequisites: migration `039` applied, dev server on port 9000.

### Database and RPC

- [ ] `brands.marketing_theme` defaults to `novu` for existing brands
- [ ] Setting `marketing_theme = 'abacus-classic'` on a brand is accepted by the DB constraint
- [ ] `get_brand_landing_public` returns `marketing_theme`, `public_stats`, and `curriculum`

### Platform admin

- [ ] `/admin/homepage` shows **Brand marketing themes** with Novu and Abacus Classic per brand
- [ ] **Save** is disabled until the selection changes
- [ ] Saving Abacus Classic persists and survives page refresh
- [ ] Public site for that brand switches layout after save (may need cache refresh)
- [ ] `/admin/brands/:slug` does **not** show marketing theme (settings + domains only)

### Public layout routing

- [ ] `novu` brand uses phone-scroll nav (`MarketingNav`) and standard footer
- [ ] `abacus-classic` brand uses sticky Abacus nav, Abacus footer, and `marketing-page--abacus-classic` wrapper
- [ ] Lead modals provider wraps Abacus layout only

### Brand editor

- [ ] `/app/homepage` on an Abacus-themed brand shows `AbacusClassicEditorForm`
- [ ] Theme label shows “managed by EduNudg platform admin”
- [ ] All accordion sections use two-column field grids and card-style add/remove buttons (same as platform `/admin/homepage`)
- [ ] Novu-themed brands still show `HomepageEditorForm`

## Manual QA checklist (Sprint 2)

Prerequisites: migration `039` applied, seed run, hosts entry for `smart-brain-abacus.localhost`, dev server on port 9000.

### Nav and hero

- [ ] Sticky nav shows logo/wordmark, section links, **Book free demo** and **Apply franchise**
- [ ] Mobile: hamburger opens dropdown with section links; both CTAs remain visible
- [ ] Hero shows age badge, headline, subtitle, and both CTAs

### Lead modals

- [ ] **Book free demo** (nav + hero) opens enroll modal with parent/child fields
- [ ] **Apply franchise** opens franchise modal with name/email fields
- [ ] Valid enroll submit creates a student lead (check brand portal leads)
- [ ] Valid franchise submit creates an inquiry (check franchise applications)
- [ ] Escape or backdrop click closes modal

### Programs marquee

- [ ] With published curriculum programs, marquee scrolls program names from DB
- [ ] With no programs, programs section is hidden
- [ ] Cards use rotating background colors

### Feature grid

- [ ] Section heading reads **Why {brand name}** (e.g. Why Smart Brain Abacus)
- [ ] Four feature cards match homepage editor content
- [ ] Disabling **Feature grid** in editor hides the section

### Theme routing

- [ ] Platform admin can set theme to `abacus-classic` on `/admin/homepage`
- [ ] `novu` brands still use phone-scroll `MarketingContent` layout

## Manual QA checklist (Sprint 3)

Prerequisites: migration `039` applied, Abacus Classic theme assigned, seed or editor content populated, dev server on port 9000.

### Founders

- [ ] **Leadership profiles** section shows one card per founder from the editor
- [ ] Photo upload displays; missing photo shows placeholder
- [ ] Stat badge (e.g. **12+ YEARS OF LEGACY**) appears on profile when configured
- [ ] Disabling **Leadership profiles** in editor hides `#founders`

### Trust and video

- [ ] Valid YouTube URL renders embedded iframe
- [ ] Empty YouTube URL shows editor placeholder message
- [ ] Stat/highlight cards show title, subtitle, and accent border color
- [ ] Optional trust CTA link works when configured
- [ ] Disabling **Trust & video** hides `#trust`

### Photo gallery

- [ ] Uploaded images scroll in a horizontal marquee (duplicated loop)
- [ ] Gallery title from editor appears above the strip
- [ ] Empty gallery hides the section on the public site
- [ ] Disabling **Photo gallery** in editor hides `#gallery`

### Rich footer

- [ ] Footer shows brand description, certification badges, and quick links
- [ ] **Live stats**: active center count and student count from DB (when > 0)
- [ ] **Custom stats** from editor appear alongside or instead of live stats
- [ ] Turning off **Show live stats** hides DB counts but keeps custom stats
- [ ] **Our presence** regions and cities render when configured
- [ ] **Head office** address, phone, and website display correctly
- [ ] Social links open in a new tab
- [ ] Copyright and legal links appear in the footer bottom bar

### Editor persistence

- [ ] Save founders/trust/gallery/footer changes at `/app/homepage` and verify on public site
- [ ] Hard refresh public site reflects saved content

## Related docs

- [Marketing landing pages (shared)](./marketing-landing.md)
- [Operations runbook](../ops/runbook.md)
