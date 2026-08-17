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
- Abacus/Spark public CTAs use **modals** (`MarketingLeadModals` + `LeadModalHashOpener`), not Novu inline forms. Pass `theme="spark-academy"` so Spark dialogs use `ac-modal--spark` (Inter, navy, pill close/submit) — `regression_spark_lead_modals_use_theme_classes`. Spark homepage motion: hero rise/float + unhurried `sa-reveal` section lift (~0.95s) + delayed `sa-reveal-item` fade-and-scale (~1.1s, ~200ms stagger) inside blocks; honor `prefers-reduced-motion` — `regression_spark_homepage_motion_css_respects_reduced_motion`, `regression_spark_section_items_stagger_inside_blocks`.
- Deep links: `#enroll` / `#enroll-student` / `#register` → enroll; `#apply` → franchise (brand only).
- Docs: `docs/frontend/abacus-classic.md`, `docs/frontend/spark-academy.md`.

## Platform homepage (`/admin/homepage`)

- Config JSON is source of truth; Storage `brand-assets` only holds files.
- **Never** discard stored media when migrating defaults — rule `marketing-homepage-media`.
- `isLegacyPlatformHomepageSeed`: enterprise blocks / `brand-assets` URLs win over Novu markers.
- Do not Save the editor while it is showing Unsplash/stock defaults over a customized DB row.
- Platform `/login` stays inside `MarketingPublicLayout` (`marketing-page--login`) with the same `EnterpriseNav` / `EnterpriseSiteFooter` as `/` — do not wrap that form in a full-viewport `ThemeProvider`. Regression: `regression_login_renders_platform_nav_and_footer`.
- Brand `/login` stays inside `BrandPublicLayout` (`marketing-page--login`) with that brand’s public nav/footer (Abacus / Spark / Novu). Regression: `regression_brand_login_renders_public_nav_and_footer`.

## Brand / franchise / student marketing

- Brand: `brand_settings.settings.landing` — always merge; fallbacks must pass `landing` partial.
- Center/franchise: `center_landing` (else brand `landing`) — same preserve rules.
- Saves: `preserveCustomMarketingMediaUrls` so stock Unsplash cannot overwrite uploads.
- Seed: `ON CONFLICT` must use `EXCLUDED.settings || brand_settings.settings` (existing wins).
- Student/login chrome: never clear `logo_url` / login copy when patching unrelated settings. Brand `/app/settings` **White-label & Login Copy** live-previews the staff login hero as you type (`LoginCopyPreview`; `regression_login_copy_preview_updates_as_you_type`) and must not rehydrate drafts from `settings.data` identity — key off `id` / `updated_at`. No Brand Identity / logo upload — Site logo lives in Homepage `landing.meta`. Platform `/admin/brands/:slug` writes that same JSON (`regression_platform_admin_logo_writes_homepage_landing_meta`). Homepage save and platform upload sync to `brands.logo_url` (`regression_brand_settings_omits_brand_identity_card`, `regression_save_brand_landing_syncs_site_logo_to_brands_logo_url`). Brand detail **Domains** and **Franchise centers** paginate after 10 rows with `DirectoryPagination` (`regression_brand_detail_paginates_centers_and_domains`).
- Helpers: `apps/web/src/lib/marketingMediaGuard.ts`.
- Social Media Connect: Facebook/Instagram footer icons on **brand and franchise** public sites — do **not** mount a WhatsApp float on public landing. Center Settings has no Social presence editor (`regression_center_settings_omits_social_presence`).
- Center public landing: never inherit brand **Apply franchise** / `#apply` secondary CTAs — `sanitizeCenterPublicNavConfig` + center merge omit them.
- Brand **Center Site Configuration** is `/app/center-site` (parent enrollment template / `center_landing`). Do not nest that editor on `/app/homepage` — `regression_center_site_config_is_its_own_page`.
- Center public programs: `get_center_landing_public` curriculum is `center_public_curriculum_json` (enabled programs only); `restrictProgramsSectionToEnabledCurriculum` drops Center sites cards that are not assigned (`regression_center_public_programs_filter_to_enabled_curriculum`).
- Brand `/app/curriculum` create **and** existing-course editor share parent marketing fields (benefits, why parents choose this, skills & outcomes, scholarship). Do not drop those fields from `CurriculumCourseDetail` after `createProgram` — `regression_created_course_shows_parent_marketing_fields`.
- Brand `/app/curriculum` has a per-course on/off toggle in the **detail header** (Active + toggle + **Save** right-aligned), not in the Courses list (`setProgramActive` → `programs.is_active`). Course title uses 50% of the header and wraps to two lines **on desktop**. On mobile, the title stacks above the toggle and **Save** so those controls stay visible and tappable. Active courses open the full editor via **Edit course** (drafts keep **Continue Setup**). Desktop add is **+ Add Curriculum** in the page header only — do not put a **+** on the Courses card. Do not hide off courses from the workspace list; public RPCs already omit `is_active = false`. Page chrome matches Franchise Applications (`PipelinePageHeader` + `LeadKpiGrid` Active/Drafts/Programs/Total) — `regression_curriculum_page_matches_franchise_apps_stats_chrome`. Regressions: `regression_curriculum_course_live_toggle_is_visible`, `regression_curriculum_detail_title_uses_half_width`, `regression_curriculum_detail_save_group_aligns_right`, `regression_courses_list_has_no_add_plus_button`, `regression_curriculum_mobile_active_course_opens_editable_detail`.
- Spark Academy **Courses designed for success** uses published `publicCurriculum` (`resolveSparkCoursePrograms`), not leftover homepage program cards. Cards are fallback only when no published courses exist — `regression_spark_courses_use_published_curriculum_over_homepage_cards`. Published syllabus still renders when leftover `programsGrid` is off (`sparkShouldShowCoursesSection`, `regression_spark_courses_show_published_syllabus_even_if_programs_grid_off`). The section title is center-aligned (`sa-section-head--center`). Course cards center in the row (`sa-courses__grid--center`, `regression_spark_course_cards_center_in_grid`). Course cards keep **Enroll now** only (no **Enroll** price/link); rating is centered below the button — `regression_spark_course_card_keeps_enroll_now_and_centers_rating_below`. Do not add **All courses** / course-name filter tabs — `regression_spark_courses_section_has_no_curriculum_tabs`. Homepage preview is one wrapping row; **View all courses** is hidden unless the catalog overflows that row, then expands in place (`regression_spark_view_all_courses_only_when_overflow`, `regression_spark_view_all_courses_hidden_when_catalog_fits`).
- Spark Academy public footer is a column grid (brand, Explore, Contact, presence on brand hosts). Do **not** render `footerCta` / newsletter / email form / Login arrow — leftover Novu “Start your network differently.” is ignored (`regression_spark_footer_is_column_layout_without_newsletter`, `regression_spark_footer_hides_novu_newsletter_cta`).
- Spark Academy **Navigation & CTAs** Link dropdown: do not list `Programs (#programs)` or `About us (#features)`. Use `Courses (#programs)` and `Features (#features)`; omit Syllabus `#curriculum` (alias of `#programs`) — `regression_spark_nav_dropdown_omits_duplicate_programs_and_about_us`. Include `Photo gallery (#gallery)`, `About page (/about)`, and `Login (/login)`; omit `About section (#about)`. Public Spark menu items, the primary CTA, and the secondary franchise CTA come from **Navigation & CTAs**. On `max-width: 1023px` hide the header secondary (`sa-nav__cta--header`) so it shows only in the left-hand drawer, which uses Spark Inter/navy/blue tokens (`marketing-page--spark-academy`) and shows the Site logo before the brand name — `regression_spark_nav_shows_secondary_cta_from_navigation`, `regression_spark_mobile_secondary_cta_header_uses_drawer_only_class`, `regression_spark_nav_drawer_css_uses_theme_tokens_and_hides_header_secondary`, `regression_spark_drawer_shows_logo_before_brand_name`. Do not hardcode brand **Login** (`nav.adminHref`) or auto-inject About Us (`regression_spark_nav_omits_hardcoded_login_on_brand_site`, `regression_spark_does_not_inject_about_nav`). Franchise drawer keeps **Student Login** and omits the secondary franchise CTA (`regression_spark_drawer_uses_student_login_on_franchise`, `regression_spark_nav_omits_secondary_cta_on_franchise`). Public Spark `#gallery` uses homepage **Photo gallery** images (`regression_spark_photo_gallery_renders_homepage_images`). Desktop `#gallery` is a wrapping grid; mobile is a two-row horizontal auto-scroll carousel (`regression_spark_gallery_mobile_carousel_markup`, `regression_spark_gallery_mobile_autoscroll_advances`).
- Homepage / Center Site **Save changes** stays clickable with no edits (`EditorSaveBar` disables only while Saving…). **Primary CTA label** and **Secondary CTA label** in Navigation & CTAs must use `onChange` only — never `commit`/`onPersist` on each keystroke, and must not copy into `hero` (`regression_homepage_save_stays_enabled_when_clean`, `regression_nav_cta_labels_do_not_persist_on_type`). Abacus/Spark **Hero** has independent **Hero CTA label** / **Hero CTA link** (`hero.ctaLabel` / `hero.ctaHref`); public hero uses those and falls back to nav only when empty (`regression_hero_cta_is_independent_of_nav_primary`, `regression_spark_hero_uses_hero_cta_not_nav`).
- Spark Academy homepage SHALL NOT render the About teaser (`#about`, ABOUT, WHAT MAKES US DIFFERENT) — those stay on `/about` (`regression_spark_homepage_omits_about_teaser_sections`). Rewrite leftover `#about` nav to `/about`.
- Spark Academy **Meet Our Expert Mentors** centers mentor cards in the row (`sa-mentors__track--center`) — `regression_spark_mentors_center_in_track`. Brand `/app/homepage` edits this list in **Mentors / Leadership** (not a section titled Mentors). Template **Founder name** is hidden on the public site (`regression_brand_founders_omit_founder_name_placeholder_even_with_photo`).
- Spark Academy **Success stories** (`#testimonials`) centers story cards in the row on desktop (`sa-testimonials__grid--center`) — `regression_spark_testimonials_center_in_grid`. On mobile (`max-width: 767px`) use a horizontal snap carousel with auto-scroll (`sa-testimonials__carousel`); pause on swipe and skip when `prefers-reduced-motion` — `regression_spark_testimonials_mobile_carousel_markup`, `regression_spark_testimonials_mobile_autoscroll_advances`.
- Spark Academy section titles share `--sa-h2-*` / `sa-section-title` (Inter, same size/weight/color). Card/list headings share `--sa-h3-*` / `sa-item-title`. Upcoming events and `/about` titles inherit those tokens. Hero stays `--sa-h1-size`. Do not give Features/Journey/Mentors/Testimonials a different clamp — `regression_spark_section_headings_share_type_scale`, `regression_spark_section_headings_use_shared_title_class`.
- Spark Academy hero Course float stays inside `sa-hero__photo-stage` (top-left). Features Last month / Learning Progress MUST be direct children of `sa-features__visual` at the top-left and bottom-right — do not nest them on the photo (covers the subject). Last month MUST NOT render a **View all →** / `floatStatsAction` control (`regression_spark_features_omits_view_all_float_action`). Regressions: `regression_spark_hero_course_float_anchors_to_photo_stage`, `regression_spark_features_floats_sit_on_visual_corners`.
- Center public footer: use brand `social_connect` via `parseBrandSocialConnect` — Facebook/Instagram footer icons; never `franchise_centers.social_links`; do **not** mount a WhatsApp float. Brand `/app/centers` and center Settings do **not** show or edit Social Media (`regression_brand_centers_detail_omits_social_media_section`, `regression_center_settings_omits_social_presence`); Save passes through existing `social_links`. Brand `/app/centers` **Export Franchise** downloads the live roster (`regression_brand_centers_exports_full_franchise_csv`).
- Brand `/app/students` uses Franchise Management chrome (`CentersPageHeader`, KPI cards, directory + detail) for a read-only roster of every active enrollment; search matches student name, franchise name, or city; **Export CSV** downloads the full roster (`regression_brand_students_page_matches_centers_chrome`, `regression_brand_students_search_by_name_franchise_city`, `regression_brand_student_card_shows_contact_and_levels`, `regression_brand_students_exports_full_roster_csv`).
- Center `/app/students` **Portal access** **Copy Profile URL** copies the student/parent learn-portal login without a password (`regression_center_student_copies_learn_login_url_without_password`).
- Center public contact: pass `centerContact={centerFooterContactFromProfile(profile)}` into Novu / Abacus / Spark footers so Location & Contact is the same overlay; never print brand `headOffice` or Spark placeholder phone on a center host.
- Center public name: `overlayCenterLandingIdentity` replaces editor placeholder `Sample Center` with Franchise Identity display/name; do not show Sample Center on View Frontend.
- Center public mentors: `overlayCenterFoundersFromIdentity` — franchiser (Franchise Identity name + master photo) first when present; brand homepage founders always follow. If no franchiser, brand owner is first. Do not render Center sites `Founder name` / Spark stock mentors. RPC key `brand_founders`.
- Center public nav: pass `brandSlug` so Student Login shows **and** the `--franchise` lockup enlarges the site name. Brand and franchise public logos share one size with no ring (`regression_franchise_frontend_nav_highlights_logo_and_name`, `regression_public_nav_logo_matches_franchise_size_without_border`).
- Upcoming events: homepage section (`upcomingEvents`) like founders — optional image, date/time/duration, maxItems; public shows only upcoming; all marketing themes.
- About Us (brand only): `landing.about` + optional `sections.about` (homepage teaser on Novu/Abacus only); Spark `/about` reuses homepage Hero / Features / Journey / Mentors (`SparkAcademyAbout`, `regression_spark_about_page_uses_homepage_section_blocks`); About-only uploads are `heroImageUrl` and `philosophyImageUrl`; Spark `/about` hides homepage hero/features badges (`regression_spark_about_hero_omits_homepage_badges`, `regression_spark_about_features_omits_float_badges`); Novu/Abacus keep dedicated About chrome (`about-us--novu` / `--abacus-classic`); Spark does not mount the homepage teaser — `regression_spark_about_page_uses_spark_theme_classes`, `regression_spark_homepage_omits_about_teaser_sections`; `/about` scrolls to the top on load (`regression_about_page_scrolls_to_top_on_load`); media via `preserveCustomMarketingMediaUrls`.

## Lead lost (reference)

- **Only center** marks lead `lost` (`mark_lead_lost` + `lost_reason`).
- **Brand reopens** via `reopen_lead`, or WhatsApp re-apply **auto-reopens** lost leads — see FR-B15 / FR-B15b / FR-C11b.
- Brand **Billing** uses `services/payments/` — brand pays platform subscription only.

## Manual leads (staff)

- Platform / brand / center manual entry — [`docs/spec/manual-leads.md`](../../docs/spec/manual-leads.md), `manualLeadsApi.ts`, RPCs in migration `019_*`.
- Brand Franchise Applications: **Add Franchise** uses a modal dialog, not an below-the-fold `AddFormSection`. Filter tabs are **Pending review** and **Decided** only (soft-deleted centers stay on Decided with DELETED). Stats strip uses `LeadKpiGrid` (Pending review, Approved, Rejected, Total) — `regression_franchise_apps_kpi_cards_match_lead_stats`.
- Brand Student Leads: same pipeline chrome as Franchise Applications (`PipelinePageHeader`, search + `FilterTabs`, `PipelineWorkspace` list stays visible with detail). KPI cards: Pending review, Converted, Lost, Total. Tabs: **Pending review** / **Decided**. Desktop detail is a single stacked column (assignment below applicant, **Recent Activity** last) — do not split applicant and assignment into a third page column. Do not render Follow-up Insights / card-grid / sort — `regression_student_leads_pipeline_layout`, `regression_student_leads_list_stays_visible_with_detail`, `regression_student_leads_detail_stacks_assignment_below_applicant`, `regression_student_leads_detail_grid_is_single_column`.
- Brand Student Leads / Center Leads: **Add lead** uses the same modal pattern (`ManualStudentLeadCard` + `ed-import-dialog`), not `AddFormSection`. Center **Add student lead** fields match the Students CSV import template; Leads column 2 has extra top padding (`regression_center_leads_detail_has_top_padding`). Center `/app/leads`, `/app/students`, `/app/fees`, `/app/inventory`, and `/app/merchandise` use Curriculum pipeline chrome (`PipelinePageHeader`, `LeadKpiGrid`, search + `FilterTabs`, `PipelineWorkspace`). Leads KPIs: Open / Converted / Lost / Total. The Leads list uses Franchise Applications cards (status badge, date, name, city/pincode) rather than a 4-column Parent/Student table (`regression_center_leads_list_uses_application_cards`). Students: Linked / Unassigned / Programs (informational) / Total; **Import students** next to **+ Add students** bulk-enrolls from CSV (`import_center_students`, not leads). **Save address** confirms with **Saved** plus **Address saved.** next to the button (`regression_save_address_shows_saved_status`). Delivery **Phone** uses a stable `Input type="tel"` wrap with no live format stripping (`regression_tel_input_does_not_remount_while_typing`). Fees: Outstanding / Paid / Overdue / Total with Invoices / Payments tabs. Inventory: In stock / Low stock / Incoming (informational) / Total; item photo in column 2 is left-aligned at 50% beside stock facts (`regression_center_inventory_detail_photo_is_half_width`); On the way and Orders share a row (`regression_center_inventory_detail_splits_on_the_way_and_orders`); column 2 uses `PipelineDetailPanel` with extra top padding + primary **Place New Order** (`regression_center_inventory_detail_uses_pipeline_theme`); detail shows **Curriculum** / **Program** (`regression_center_inventory_shows_catalog_curriculum`); list cards stay identity-only (`regression_center_inventory_list_omits_detail_duplicates`). Merchandise: Catalog / Unpaid / Orders / Total with Shop / My Orders tabs; Shop catalog is one horizontal card per SKU with an 8rem photo beside title + price and Curriculum/Program under the SKU (`regression_center_merchandise_shop_shows_catalog_curriculum`); qty and **Add to Order** stack in a full-width footer (never clip the add label at Curriculum width); desktop list/detail split matches Curriculum (`regression_center_merchandise_list_column_matches_curriculum_width`, `regression_center_merchandise_shop_cards_are_horizontal_one_per_row`, `regression_center_merchandise_shop_add_label_is_not_truncated`, `regression_center_merchandise_shop_row_image_is_at_least_double_width`) — `regression_center_leads_pipeline_workspace_theme`, `regression_center_students_page_matches_curriculum_stats_chrome`, `regression_center_fees_page_matches_curriculum_stats_chrome`, `regression_center_inventory_page_matches_curriculum_stats_chrome`, `regression_center_merchandise_page_matches_curriculum_stats_chrome`.
- Brand Success Stories (`/app/success-stories`): same pipeline chrome as Franchise Applications (`PipelinePageHeader`, search + `FilterTabs`, `LeadKpiGrid`, `PipelineWorkspace` list stays visible with detail). KPI cards: Published, Draft, With photo, Total. Tabs: **Published** / **Draft**. **Add Story** uses `ed-import-dialog`, not `AddFormSection` — `regression_success_stories_kpi_cards_match_pipeline_stats`, `regression_add_story_opens_modal_instead_of_below_fold_form`.
- Brand Merchandise (`/app/merchandise`): same pipeline chrome as Franchise Applications (`PipelinePageHeader`, search + `FilterTabs`, `LeadKpiGrid`). KPI cards: Active, Draft, Orders, Total. Tabs stay **Catalog** / **Promo Codes** / **Orders** / **Payment settings**. Desktop Catalog, Promo Codes, Orders, and Payment settings all use `PipelineWorkspace` list + detail — `regression_merchandise_page_matches_franchise_apps_stats_chrome`, `regression_merchandise_section_tabs_keep_catalog_workspace_chrome`. Search stays on the current tab. Promo Codes use **+ Add Promo Code** in the page header. Catalog SKUs must be tied to curriculum; franchise Shop and Inventory only show SKUs for courses assigned on `/app/centers` (`regression_unassigned_sku_is_hidden_from_center`, `regression_inventory_omits_skus_not_in_assigned_catalog`). Do not add a Competitions tab.
- App pages use `PageGrid` / `FormGrid` from `@edunudg/ui` — see [`ui-shell-standards.md`](../../docs/spec/ui-shell-standards.md).
- Staff `AppShell` (brand/center `/app`, platform `/admin`) passes `resetScrollKey={pathname}` so tab changes scroll to the top — `regression_staff_app_scrolls_to_top_on_tab_change`. The mobile top bar shows `logoUrl` beside the product name — `regression_staff_mobile_bar_shows_brand_logo`. Center `/app` lockup uses the **brand name** with the franchise display name as `portalTagline` — `regression_center_shell_lockup_shows_brand_then_franchise_name`.

## Before finish

- [ ] Run **`edunudg-sync-artifacts`** — OpenSpec, docs, tests, skills/rules, agent briefs as applicable
- [ ] Stay inside Frontend role fences (`agent-boundaries`); escalate schema to Database
