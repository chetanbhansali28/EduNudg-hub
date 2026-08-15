---
name: edunudg-modular-features
description: Add EduNudg features using modular files, service layer, base theme, and feature flags. Use for any new screen, integration, or payment flow.
---

# Modular features

## Before coding

1. Read [`docs/spec/services-layer.md`](../../docs/spec/services-layer.md) and [`docs/spec/feature-flags.md`](../../docs/spec/feature-flags.md).
2. Read [ui-shell-standards.md](../../docs/spec/ui-shell-standards.md) for layout grid.

## Checklist

### Structure

- [ ] New feature folder under `apps/web/src/features/<portal>/<featureName>/` — **do not** bolt onto unrelated pages.
- [ ] Route wires only via `AppRoutes.tsx` import + path.
- [ ] Colocated `*.test.ts(x)`.

### Theme

- [ ] Uses `@edunudg/ui` (`Card`, `Input`, `Button`, shell) — no one-off form markup unless extending ui package.
- [ ] Responsive 3/2/1 column per ui-shell standards.

### Services

- [ ] Supabase/RPC calls in `*Api.ts` or `services/` — not inside JSX event handlers beyond one-liner delegation.
- [ ] Auth/social login via `services/auth/`.
- [ ] Payments via `services/payments/` gateway interface.
- [ ] Third-party APIs only under `services/integrations/<vendor>/`.

### Feature flags

- [ ] Add flag key to spec doc + `brand_settings.settings.features` or platform settings.
- [ ] Nav item gated with `useFeatureFlag('key')`.
- [ ] Default **off** for new integrations.

### Backend

- [ ] Public/critical mutations via RPC (tenant-safe).
- [ ] RLS on new tables; tests in `supabase/tests/`.

## Anti-patterns

- 300+ line page files mixing unrelated flows
- `getSupabase().from(...)` directly in five components for the same table
- Shipping integration without OFF switch
- Payment provider SDK imported in random feature folders

## Marketing themes (Abacus / Spark)

- Theme assigned by platform admin on brand detail (`brands.marketing_theme`).
- Abacus/Spark public CTAs use **modals** (`MarketingLeadModals` + `LeadModalHashOpener`), not Novu inline forms.
- Deep links: `#enroll` / `#enroll-student` / `#register` → enroll; `#apply` → franchise (brand only).
- Docs: `docs/frontend/abacus-classic.md`, `docs/frontend/spark-academy.md`.

## Platform homepage (`/admin/homepage`)

- Config JSON is source of truth; Storage `brand-assets` only holds files.
- **Never** discard stored media when migrating defaults — rule `marketing-homepage-media`.
- `isLegacyPlatformHomepageSeed`: enterprise blocks / `brand-assets` URLs win over Novu markers.
- Do not Save the editor while it is showing Unsplash/stock defaults over a customized DB row.

## Brand / franchise / student marketing

- Brand: `brand_settings.settings.landing` — always merge; fallbacks must pass `landing` partial.
- Center/franchise: `center_landing` (else brand `landing`) — same preserve rules.
- Saves: `preserveCustomMarketingMediaUrls` so stock Unsplash cannot overwrite uploads.
- Seed: `ON CONFLICT` must use `EXCLUDED.settings || brand_settings.settings` (existing wins).
- Student/login chrome: never clear `logo_url` / login copy when patching unrelated settings.
- Helpers: `apps/web/src/lib/marketingMediaGuard.ts`.
- Social Media Connect: Facebook/Instagram footer icons only — do **not** mount a WhatsApp float on public brand landing.
- Center public landing: never inherit brand **Apply franchise** / `#apply` secondary CTAs — `sanitizeCenterPublicNavConfig` + center merge omit them.
- Brand **Center Site Configuration** is `/app/center-site` (parent enrollment template / `center_landing`). Do not nest that editor on `/app/homepage` — `regression_center_site_config_is_its_own_page`.
- Center public programs: `get_center_landing_public` curriculum is `center_public_curriculum_json` (enabled programs only); `restrictProgramsSectionToEnabledCurriculum` drops Center sites cards that are not assigned (`regression_center_public_programs_filter_to_enabled_curriculum`).
- Brand `/app/curriculum` create **and** existing-course editor share parent marketing fields (benefits, why parents choose this, skills & outcomes, scholarship). Do not drop those fields from `CurriculumCourseDetail` after `createProgram` — `regression_created_course_shows_parent_marketing_fields`.
- Brand `/app/curriculum` has a per-course on/off toggle in the **detail header** (Active + toggle + **Save** right-aligned), not in the Courses list (`setProgramActive` → `programs.is_active`). Course title uses 50% of the header and wraps to two lines. Desktop add is **+ Add Curriculum** in the page header only — do not put a **+** on the Courses card. Do not hide off courses from the workspace list; public RPCs already omit `is_active = false`. Page chrome matches Franchise Applications (`PipelinePageHeader` + `LeadKpiGrid` Active/Drafts/Programs/Total) — `regression_curriculum_page_matches_franchise_apps_stats_chrome`. Regressions: `regression_curriculum_course_live_toggle_is_visible`, `regression_curriculum_detail_title_uses_half_width`, `regression_curriculum_detail_save_group_aligns_right`, `regression_courses_list_has_no_add_plus_button`.
- Spark Academy **Courses designed for success** uses published `publicCurriculum` (`resolveSparkCoursePrograms`), not leftover homepage program cards. Cards are fallback only when no published courses exist — `regression_spark_courses_use_published_curriculum_over_homepage_cards`. Course cards keep **Enroll now** only (no **Enroll** price/link); rating is centered below the button — `regression_spark_course_card_keeps_enroll_now_and_centers_rating_below`. Do not add **All courses** / course-name filter tabs — `regression_spark_courses_section_has_no_curriculum_tabs`.
- Spark Academy public footer is a column grid (brand, Explore, Contact, presence on brand hosts). Do **not** render `footerCta` / newsletter / email form / Login arrow — leftover Novu “Start your network differently.” is ignored (`regression_spark_footer_is_column_layout_without_newsletter`, `regression_spark_footer_hides_novu_newsletter_cta`).
- Spark Academy **Navigation & CTAs** Link dropdown: do not list `Programs (#programs)` or `About us (#features)`. Use `Courses (#programs)` and `Features (#features)`; omit Syllabus `#curriculum` (alias of `#programs`) — `regression_spark_nav_dropdown_omits_duplicate_programs_and_about_us`. Include `Photo gallery (#gallery)`. Public Spark `#gallery` uses homepage **Photo gallery** images (`regression_spark_photo_gallery_renders_homepage_images`).
- Spark Academy **Meet Our Expert Mentors** centers mentor cards in the row (`sa-mentors__track--center`) — `regression_spark_mentors_center_in_track`.
- Spark Academy **Success stories** (`#testimonials`) centers story cards in the row (`sa-testimonials__grid--center`) — `regression_spark_testimonials_center_in_grid`.
- Spark Academy section titles share `--sa-h2-*` / `sa-section-title` (Inter, same size/weight/color). Card/list headings share `--sa-h3-*` / `sa-item-title`. About teaser and upcoming events titles inherit those tokens. Hero stays `--sa-h1-size`. Do not give Features/Journey/Mentors/Testimonials a different clamp — `regression_spark_section_headings_share_type_scale`, `regression_spark_section_headings_use_shared_title_class`.
- Center public footer: use `franchise_centers.social_links` via `socialConnectFromCenterLinks` — Facebook, Instagram, YouTube, WhatsApp, LinkedIn, X as footer icons; never brand `social_connect`; do **not** mount a WhatsApp float. Brand `/app/centers` does **not** show or edit Social Media (`regression_brand_centers_detail_omits_social_media_section`); Save passes through existing `social_links`.
- Center public contact: pass `centerContact={centerFooterContactFromProfile(profile)}` into Novu / Abacus / Spark footers so Location & Contact is the same overlay; never print brand `headOffice` or Spark placeholder phone on a center host.
- Center public name: `overlayCenterLandingIdentity` replaces editor placeholder `Sample Center` with Franchise Identity display/name; do not show Sample Center on View Frontend.
- Center public nav: pass `brandSlug` so Student Login shows **and** the `--franchise` lockup enlarges/highlights logo + site name (`regression_franchise_frontend_nav_highlights_logo_and_name`).
- Upcoming events: homepage section (`upcomingEvents`) like founders — optional image, date/time/duration, maxItems; public shows only upcoming; all marketing themes.
- About Us (brand only): `landing.about` + optional `sections.about`; public `/about` chrome follows `marketing_theme` (`about-us--novu` / `--abacus-classic` / `--spark-academy`); Spark uses `SparkAcademyCta` — `regression_spark_about_page_uses_spark_theme_classes`; media via `preserveCustomMarketingMediaUrls`.

## Lead lost (reference)

- **Only center** marks lead `lost` (`mark_lead_lost` + `lost_reason`).
- **Brand reopens** via `reopen_lead`, or WhatsApp re-apply **auto-reopens** lost leads — see FR-B15 / FR-B15b / FR-C11b.
- Brand **Billing** uses `services/payments/` — brand pays platform subscription only.

## Manual leads (staff)

- Platform / brand / center manual entry — [`docs/spec/manual-leads.md`](../../docs/spec/manual-leads.md), `manualLeadsApi.ts`, RPCs in migration `019_*`.
- Brand Franchise Applications: **Add Franchise** uses a modal dialog, not an below-the-fold `AddFormSection`. Filter tabs are **Pending review** and **Decided** only (soft-deleted centers stay on Decided with DELETED). Stats strip uses `LeadKpiGrid` (Pending review, Approved, Rejected, Total) — `regression_franchise_apps_kpi_cards_match_lead_stats`.
- Brand Student Leads: same pipeline chrome as Franchise Applications (`PipelinePageHeader`, search + `FilterTabs`, `PipelineWorkspace` list stays visible with detail). KPI cards: Pending review, Converted, Lost, Total. Tabs: **Pending review** / **Decided**. Desktop detail is a single stacked column (assignment below applicant, **Recent Activity** last) — do not split applicant and assignment into a third page column. Do not render Follow-up Insights / card-grid / sort — `regression_student_leads_pipeline_layout`, `regression_student_leads_list_stays_visible_with_detail`, `regression_student_leads_detail_stacks_assignment_below_applicant`, `regression_student_leads_detail_grid_is_single_column`.
- Brand Student Leads / Center Leads: **Add lead** uses the same modal pattern (`ManualStudentLeadCard` + `ed-import-dialog`), not `AddFormSection`.
- Brand Success Stories (`/app/success-stories`): same pipeline chrome as Franchise Applications (`PipelinePageHeader`, search + `FilterTabs`, `LeadKpiGrid`, `PipelineWorkspace` list stays visible with detail). KPI cards: Published, Draft, With photo, Total. Tabs: **Published** / **Draft**. **Add Story** uses `ed-import-dialog`, not `AddFormSection` — `regression_success_stories_kpi_cards_match_pipeline_stats`, `regression_add_story_opens_modal_instead_of_below_fold_form`.
- Brand Merchandise (`/app/merchandise`): same pipeline chrome as Franchise Applications (`PipelinePageHeader`, search + `FilterTabs`, `LeadKpiGrid`). KPI cards: Active, Draft, Orders, Total. Tabs stay **Catalog** / **Promo Codes** / **Orders** / **Payment settings**. Desktop Catalog uses `PipelineWorkspace` list + detail — `regression_merchandise_page_matches_franchise_apps_stats_chrome`. Do not add a Competitions tab.
- App pages use `PageGrid` / `FormGrid` from `@edunudg/ui` — see [`ui-shell-standards.md`](../../docs/spec/ui-shell-standards.md).

## Before finish

- [ ] Run **`edunudg-sync-artifacts`** — OpenSpec, docs, tests, skills/rules, agent briefs as applicable
- [ ] Stay inside Frontend role fences (`agent-boundaries`); escalate schema to Database
