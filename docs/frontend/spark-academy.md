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
| Mentors / testimonials | `MentorsSection` (cards centered in the track), `TestimonialsSection` (desktop: cards centered in the row; mobile: horizontal auto-scroll carousel) |
| Journey stats | `JourneySection` |
| Features | `FeaturesSection` |
| Photo gallery | `GallerySection` (`#gallery`; `config.gallery` from **Photo gallery** in `/app/homepage`) |
| FAQ | `FaqSection` |
| Footer | `SparkAcademyFooter` (column grid; no newsletter / pre-footer CTA) |
| Nav / course buttons | `SparkAcademyCta` |
| Page shell | `SparkAcademyContent` |

`SparkAcademyFooter` is a dark column layout: brand + description, **Explore** links, **Contact** (phone/address + social icons), and **Our presence** on brand hosts. It does **not** render `footerCta` (no “Start your network differently.”, “Start Your Learning Journey Today!”, email/newsletter form, or Login/arrow CTA). Leftover Novu `footerCta` in stored landing JSON is ignored.

On a **center** host, `SparkAcademyFooter` receives `centerContact` and shows Franchise Management phone/address under Contact (never the brand placeholder `(222) 545-4543`, brand Head office, or Our presence). Brand hosts keep `headOffice` phone/address or the placeholder.

Section order and toggles follow Spark defaults in `brandLandingDefaults` / homepage section keys. Center hosts inherit the brand theme via `mergeSparkAcademyCenterLandingConfig()`.

**Courses designed for success** uses that brand’s published Curriculum catalog (the same data as the homepage and Center Site **Curriculum syllabus** section). The section title is center-aligned (`sa-section-head--center`). Course cards sit in a centered wrapping row (`sa-courses__grid--center`) when there are fewer than a full row. Leftover Abacus Classic program cards in `landing.programsSection` must not hide those courses. Matching card images still fill in when a published course has no banner. Published courses still render when leftover `programsGrid` is off (`regression_spark_courses_show_published_syllabus_even_if_programs_grid_off`).

Each course card keeps **Enroll now** only (no separate **Enroll** price/link). The star rating sits below that button and is centered. The section has no **All courses** / course-name filter tabs — every published course card is shown in one grid.

Homepage editor **Navigation & CTAs** is the source of truth for Spark public menus. The Link dropdown uses `Courses (#programs)` and `Features (#features)` — not duplicate `Programs` / `About us` labels (Syllabus `#curriculum` is omitted because it aliases `#programs`). It includes `Photo gallery (#gallery)`, `About page (/about)`, and `Login (/login)`. Spark does **not** auto-inject About Us or a hardcoded Login button. Regression: `regression_spark_nav_dropdown_omits_duplicate_programs_and_about_us`, `regression_spark_does_not_inject_about_nav`, `regression_spark_nav_omits_hardcoded_login_on_brand_site`.

**Photo gallery** on the public Spark homepage (`#gallery`) uses the same `landing.gallery` title and images as `/app/homepage` **Photo gallery**. Empty URL slots are skipped. The block sits after FAQ. Desktop is a wrapping photo grid. On `max-width: 767px` photos become a two-row horizontal auto-scroll carousel (`grid-auto-flow: column`); pause on swipe and skip when `prefers-reduced-motion`. Regression: `regression_spark_photo_gallery_renders_homepage_images`, `regression_spark_gallery_mobile_carousel_markup`, `regression_spark_gallery_mobile_autoscroll_advances`.

The **Hero** accordion has its own **Hero CTA label** and **Hero CTA link**. The public hero button uses those fields (`hero.ctaLabel` / `hero.ctaHref`) and only falls back to the Navigation Primary CTA when they are empty. Changing the header Primary CTA no longer copies into the hero. Regression: `regression_hero_cta_is_independent_of_nav_primary`, `regression_spark_hero_uses_hero_cta_not_nav`.

The public header and hamburger drawer render **Navigation & CTAs** menu items plus the primary CTA. The secondary franchise CTA sits in the desktop header and, on `max-width: 1023px`, **only** in the left-hand drawer (`sa-nav__cta--header` hidden). The drawer uses Spark Academy Inter/navy/blue tokens (`marketing-page--spark-academy`) and shows the Site logo immediately before the brand name. Brand hosts do **not** hardcode **Login** (`nav.adminHref`). Add **Login** → `/login` as a menu item when it should appear. Franchise hosts keep **Student Login** in the drawer and omit the secondary franchise CTA. Regression: `regression_spark_nav_omits_hardcoded_login_on_brand_site`, `regression_spark_nav_login_comes_from_navigation_ctas`, `regression_spark_nav_shows_secondary_cta_from_navigation`, `regression_spark_mobile_secondary_cta_header_uses_drawer_only_class`, `regression_spark_nav_drawer_css_uses_theme_tokens_and_hides_header_secondary`, `regression_spark_drawer_shows_logo_before_brand_name`, `regression_spark_nav_omits_secondary_cta_on_franchise`, `regression_spark_drawer_uses_student_login_on_franchise`.

**Save changes** on `/app/homepage` stays enabled with no edits. Primary/Secondary CTA labels in Navigation & CTAs, and Hero CTA fields, are local drafts (no save-on-type). Regression: `regression_homepage_save_stays_enabled_when_clean`, `regression_nav_cta_labels_do_not_persist_on_type`, `regression_hero_cta_is_independent_of_nav_primary`.

**About Us (`/about`):** BrandPublicLayout already wraps the page with Spark nav/footer. The body uses `about-us--spark-academy` (light hero, Spark headings, mentor-style team cards, navy CTA band + `SparkAcademyCta`). Content is still `landing.about`. The Spark homepage does **not** render the `#about` teaser (`ABOUT …` / `WHAT MAKES US DIFFERENT?`) — those live only on `/about`. On load the viewport scrolls to the top (`scrollPublicPageToTop`) unless a hash is present. Regression: `regression_spark_about_page_uses_spark_theme_classes`, `regression_spark_homepage_omits_about_teaser_sections`, `regression_about_page_scrolls_to_top_on_load`.

Section titles (courses, features, journey, mentors, testimonials, FAQ, gallery, upcoming events) share one Inter type scale: `--sa-h2-size` / weight 800 / navy. Card and list headings share `--sa-h3-size`. The hero `h1` stays the larger display title. Footer column labels stay small uppercase chrome. Regression: `regression_spark_section_headings_share_type_scale`, `regression_spark_section_headings_use_shared_title_class`.

Hero **Course** stays on the photo top-left (`sa-hero__photo-stage`). Features **Last month** and **Learning Progress** sit on the corners of the entire image section (`sa-features__visual`: top-left and bottom-right) so they do not cover the photo. Regression: `regression_spark_hero_course_float_anchors_to_photo_stage`, `regression_spark_features_floats_sit_on_visual_corners`.

**Success stories** (`#testimonials`) stay a centered wrapping grid on desktop. On `max-width: 767px` the cards become a horizontal snap carousel (`sa-testimonials__carousel`) that auto-advances every 4s, pauses on swipe, and stays still when `prefers-reduced-motion` is on. Regression: `regression_spark_testimonials_mobile_carousel_markup`, `regression_spark_testimonials_mobile_autoscroll_advances`.

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
