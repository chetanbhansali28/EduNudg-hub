# Spark Academy marketing theme

Educat-style public brand sites (`marketing_theme = 'spark-academy'`). Platform admins assign the theme at **Platform → Brands → Edit** → **Brand settings** → **Website theme**.

Brand owners edit copy at `{brand}.localhost:9000/app/homepage` via `AbacusClassicEditorForm` (shared accordion editor; Spark-specific public sections live under `apps/web/src/features/marketing/spark-academy/`).

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
| Footer + CTA | `SparkAcademyFooter`, `SparkAcademyCta` |
| Page shell | `SparkAcademyContent` |

Section order and toggles follow Spark defaults in `brandLandingDefaults` / homepage section keys. Center hosts inherit the brand theme via `mergeSparkAcademyCenterLandingConfig()`.

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
