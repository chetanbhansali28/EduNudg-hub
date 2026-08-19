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
| About (`/about`) | `SparkAcademyAbout` — same Hero / Features / Journey / Mentors as `/`, filled from `landing.about` |

`SparkAcademyFooter` is a dark column layout: brand + description, **Explore** links, **Contact** (phone/address + social icons), and **Our presence** on brand hosts. It does **not** render `footerCta` (no “Start your network differently.”, “Start Your Learning Journey Today!”, email/newsletter form, or Login/arrow CTA). Leftover Novu `footerCta` in stored landing JSON is ignored.

On a **center** host, `SparkAcademyFooter` receives `centerContact` and shows Franchise Management phone/address under Contact (never the brand placeholder `(222) 545-4543`, brand Head office, or Our presence). Brand hosts keep `headOffice` phone/address or the placeholder.

Section order and toggles follow Spark defaults in `brandLandingDefaults` / homepage section keys. Center hosts inherit the brand theme via `mergeSparkAcademyCenterLandingConfig()`. **Meet Our Expert Mentors** is edited at brand `/app/homepage` under **Mentors / Leadership** (`landing.founders`). Template **Founder name** is not shown live. On a franchise host the Franchise Identity owner/photo is prepended when present (`overlayCenterFoundersFromIdentity`).

**Courses designed for success** uses that brand’s published Curriculum catalog (the same data as the homepage and Center Site **Curriculum syllabus** section). The section title is center-aligned (`sa-section-head--center`). Course cards sit in a centered wrapping row (`sa-courses__grid--center`) when there are fewer than a full row; extra courses stay hidden until **View all courses**. Leftover Abacus Classic program cards in `landing.programsSection` must not hide those courses. Matching card images still fill in when a published course has no banner. Published courses still render when leftover `programsGrid` is off (`regression_spark_courses_show_published_syllabus_even_if_programs_grid_off`).

Each course card keeps **Enroll now** only (no separate **Enroll** price/link). The star rating sits below that button and is centered. The section has no **All courses** / course-name filter tabs. The homepage shows one wrapping row of cards (`flex: 1 1 18rem`, `gap: 1.5rem`; desktop fallback 3). **View all courses** appears only when the catalog overflows that row; choosing it reveals the rest in the same grid and then hides the button (it does not open enroll). Regression: `regression_spark_view_all_courses_only_when_overflow`, `regression_spark_view_all_courses_hidden_when_catalog_fits`.

Homepage editor **Navigation & CTAs** is the source of truth for Spark public menus. The Link dropdown uses `Courses (#programs)` and `Features (#features)` — not duplicate `Programs` / `About us` labels (Syllabus `#curriculum` is omitted because it aliases `#programs`). It includes `Photo gallery (#gallery)`, `About page (/about)`, and `Login (/login)`. Spark does **not** auto-inject About Us or a hardcoded Login button. Regression: `regression_spark_nav_dropdown_omits_duplicate_programs_and_about_us`, `regression_spark_does_not_inject_about_nav`, `regression_spark_nav_omits_hardcoded_login_on_brand_site`.

**Photo gallery** on the public Spark homepage (`#gallery`) uses the same `landing.gallery` title and images as `/app/homepage` **Photo gallery**. Empty URL slots are skipped. The block sits after FAQ. Desktop is a wrapping photo grid. On `max-width: 767px` photos become a two-row horizontal auto-scroll carousel (`grid-auto-flow: column`); pause on swipe and skip when `prefers-reduced-motion`. Regression: `regression_spark_photo_gallery_renders_homepage_images`, `regression_spark_gallery_mobile_carousel_markup`, `regression_spark_gallery_mobile_autoscroll_advances`.

The **Hero** accordion has its own **Hero CTA label** and **Hero CTA link**. The public hero button uses those fields (`hero.ctaLabel` / `hero.ctaHref`) and only falls back to the Navigation Primary CTA when they are empty. Changing the header Primary CTA no longer copies into the hero. Regression: `regression_hero_cta_is_independent_of_nav_primary`, `regression_spark_hero_uses_hero_cta_not_nav`.

The public header and hamburger drawer render **Navigation & CTAs** menu items plus the primary CTA. The Site logo matches the franchise nav size and has no ring (`regression_public_nav_logo_matches_franchise_size_without_border`). The secondary franchise CTA sits in the desktop header and, on `max-width: 1023px`, **only** in the left-hand drawer (`sa-nav__cta--header` hidden). The drawer uses Spark Academy Inter/navy/blue tokens (`marketing-page--spark-academy`) and shows the Site logo immediately before the brand name. Brand hosts do **not** hardcode **Login** (`nav.adminHref`). Add **Login** → `/login` as a menu item when it should appear. Franchise hosts keep **Student Login** in the drawer and omit the secondary franchise CTA. Regression: `regression_spark_nav_omits_hardcoded_login_on_brand_site`, `regression_spark_nav_login_comes_from_navigation_ctas`, `regression_spark_nav_shows_secondary_cta_from_navigation`, `regression_spark_mobile_secondary_cta_header_uses_drawer_only_class`, `regression_spark_nav_drawer_css_uses_theme_tokens_and_hides_header_secondary`, `regression_spark_drawer_shows_logo_before_brand_name`, `regression_spark_nav_omits_secondary_cta_on_franchise`, `regression_spark_drawer_uses_student_login_on_franchise`.

**Save changes** on `/app/homepage` stays enabled with no edits. Primary/Secondary CTA labels in Navigation & CTAs, and Hero CTA fields, are local drafts (no save-on-type). Regression: `regression_homepage_save_stays_enabled_when_clean`, `regression_nav_cta_labels_do_not_persist_on_type`, `regression_hero_cta_is_independent_of_nav_primary`.

**About Us (`/about`):** BrandPublicLayout already wraps the page with Spark nav/footer. The body reuses homepage blocks — `SparkAcademyHero`, `FeaturesSection`, `JourneySection`, `MentorsSection` — filled from `landing.about` (no Mastermind-only About chrome). Hero banner (`heroImageUrl`) and Philosophy image (`philosophyImageUrl`) are About-only uploads in Homepage Configuration. Spark `/about` omits homepage badges: hero About/Course/Learners/stats overlays and Features Last month / Learning Progress (`regression_spark_about_hero_omits_homepage_badges`, `regression_spark_about_features_omits_float_badges`). Those badges stay on `/`. Section ids are `about-*` so homepage hashes still target `/`. The Spark homepage does **not** render the `#about` teaser (`ABOUT …` / `WHAT MAKES US DIFFERENT?`) — those live only on `/about`. On load the viewport scrolls to the top (`scrollPublicPageToTop`) unless a hash is present. Regression: `regression_spark_about_page_uses_homepage_section_blocks`, `regression_spark_about_page_uses_spark_theme_classes`, `regression_spark_homepage_omits_about_teaser_sections`, `regression_about_page_scrolls_to_top_on_load`.

Section titles (courses, features, journey, mentors, testimonials, FAQ, gallery, upcoming events) share one Inter type scale: `--sa-h2-size` / weight 800 / navy. Card and list headings share `--sa-h3-size`. The hero `h1` stays the larger display title. Footer column labels stay small uppercase chrome. Regression: `regression_spark_section_headings_share_type_scale`, `regression_spark_section_headings_use_shared_title_class`.

Hero **Course** stays on the photo top-left (`sa-hero__photo-stage`). Features **Last month** and **Learning Progress** sit on the corners of the entire image section (`sa-features__visual`: top-left and bottom-right) so they do not cover the photo. Last month shows label + value only — leftover `floatStatsAction` / **View all →** is not rendered, and Homepage Configuration has no Stats card action field. Regression: `regression_spark_hero_course_float_anchors_to_photo_stage`, `regression_spark_features_floats_sit_on_visual_corners`, `regression_spark_features_omits_view_all_float_action`.

**Success stories** (`#testimonials`) stay a centered wrapping grid on desktop. On `max-width: 767px` the cards become a horizontal snap carousel (`sa-testimonials__carousel`) that auto-advances every 4s, pauses on swipe, and stays still when `prefers-reduced-motion` is on. Regression: `regression_spark_testimonials_mobile_carousel_markup`, `regression_spark_testimonials_mobile_autoscroll_advances`.

## Lead modals (shared with Abacus Classic)

Spark uses the same modal stack as Abacus Classic, with Spark chrome:

| Deep link / CTA | Modal | Submit |
|-----------------|-------|--------|
| `#enroll`, `#enroll-student`, `#register`, href `enroll` | Enroll | Brand: `submitBrandStudentApplication`; Center (+ `centerSlug`): `submitCenterStudentRegistration` |
| `#apply`, href `apply` | Franchise apply | `submitFranchiseInquiry` (brand host only) |

- Provider + modals: `LeadModalProvider`, `MarketingLeadModals theme="spark-academy"` in brand/center public layouts (`ac-modal--spark`: Inter, navy heading, pill close, navy submit, blue focus)
- Hash opener: `LeadModalHashOpener` (opens modal from URL hash)
- Mapping: `resolveLeadModalKind.ts`

Playwright: `e2e/helpers/leadModals.ts`. Vitest: `MarketingLeadModals.test.ts` (`regression_deep_link_aliases_open_enroll_modal`), `SparkAcademyLeadModals.test.tsx` (`regression_spark_lead_modals_use_theme_classes`).

## Motion

Hero copy/photo fade up on load; course floats gently bob. Lower sections use `sa-reveal` + `useScrollReveal(".sa-reveal", { threshold: 0.16, rootMargin: "0px 0px -12% 0px" })` — an unhurried ~0.95s vertical lift. Items inside use `sa-reveal-item` with a ~1.1s fade-and-scale (`sa-item-in`) starting ~0.55s after the section, staggered ~200ms, so the inner beat is readable. Respect `prefers-reduced-motion`. Regressions: `regression_spark_homepage_motion_css_respects_reduced_motion`, `regression_spark_section_items_stagger_inside_blocks`.

## Related

- [Marketing landing pages (shared)](./marketing-landing.md)
- [Abacus Classic theme](./abacus-classic.md) — shared modal + editor patterns
- OpenSpec: [`student-leads`](../../openspec/specs/student-leads/spec.md), [`franchise-applications`](../../openspec/specs/franchise-applications/spec.md)
