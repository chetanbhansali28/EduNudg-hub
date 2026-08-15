# Spark Academy marketing theme

Educat-style public brand sites (`marketing_theme = 'spark-academy'`). Platform admins assign the theme at **Platform → Brands → Edit** → **Brand settings** → **Website theme**.

Brand owners edit copy at `{brand}.localhost:9000/app/homepage` (brand site) and `{brand}.localhost:9000/app/center-site` (center enrollment template) via `AbacusClassicEditorForm` (shared accordion editor; Spark-specific public sections live under `apps/web/src/features/marketing/spark-academy/`).

Local seeded demo often uses Spark for AbacusWorld — see [Operations runbook](../ops/runbook.md#urls-port-9000).

## Layout

| Piece | Component |
|-------|-----------|
| Nav | `SparkAcademyNav` |
| Hero | `SparkAcademyHero` |
| Courses / programs | `CoursesSection` (`#programs`; `#curriculum` alias) |
| Mentors / testimonials | `MentorsSection`, `TestimonialsSection` |
| Journey stats | `JourneySection` |
| Features | `FeaturesSection` |
| FAQ | `FaqSection` |
| Footer | `SparkAcademyFooter` (column grid; no newsletter / pre-footer CTA) |
| Nav / course buttons | `SparkAcademyCta` |
| Page shell | `SparkAcademyContent` |

`SparkAcademyFooter` is a dark column layout: brand + description, **Explore** links, **Contact** (phone/address + social icons), and **Our presence** on brand hosts. It does **not** render `footerCta` (no “Start your network differently.”, “Start Your Learning Journey Today!”, email/newsletter form, or Login/arrow CTA). Leftover Novu `footerCta` in stored landing JSON is ignored.

On a **center** host, `SparkAcademyFooter` receives `centerContact` and shows Franchise Management phone/address under Contact (never the brand placeholder `(222) 545-4543`, brand Head office, or Our presence). Brand hosts keep `headOffice` phone/address or the placeholder.

Section order and toggles follow Spark defaults in `brandLandingDefaults` / homepage section keys. Center hosts inherit the brand theme via `mergeSparkAcademyCenterLandingConfig()`.

**Courses designed for success** uses that brand’s published Curriculum catalog (the same data as the homepage editor **Curriculum syllabus** section). Leftover Abacus Classic program cards in `landing.programsSection` must not hide those courses. Matching card images still fill in when a published course has no banner.

Each course card keeps **Enroll now** only (no separate **Enroll** price/link). The star rating sits below that button and is centered. The section has no **All courses** / course-name filter tabs — every published course card is shown in one grid.

## Lead modals (shared with Abacus Classic)

Spark uses the same modal stack as Abacus Classic:

| Deep link / CTA | Modal | Submit |
|-----------------|-------|--------|
| `#enroll`, `#enroll-student`, `#register`, href `enroll` | Enroll | Brand: `submitBrandStudentApplication`; Center (+ `centerSlug`): `submitCenterStudentRegistration` |
| `#apply`, href `apply` | Franchise apply | `submitFranchiseInquiry` (brand host only) |

- Provider + modals: `LeadModalProvider`, `MarketingLeadModals` in brand/center public layouts
- Hash opener: `LeadModalHashOpener` (opens modal from URL hash)
- Mapping: `resolveLeadModalKind.ts`

Playwright: `e2e/helpers/leadModals.ts`. Vitest: `MarketingLeadModals.test.ts` (`regression_deep_link_aliases_open_enroll_modal`).

## Related

- [Marketing landing pages (shared)](./marketing-landing.md)
- [Abacus Classic theme](./abacus-classic.md) — shared modal + editor patterns
- OpenSpec: [`student-leads`](../../openspec/specs/student-leads/spec.md), [`franchise-applications`](../../openspec/specs/franchise-applications/spec.md)
