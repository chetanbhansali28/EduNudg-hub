---
name: edunudg-write-tests
description: Write tests for EduNudg features and bugfixes. Required for every PR.
---

# Write Tests

| Change | Tests |
|--------|-------|
| `packages/*` logic | Vitest `*.test.ts` |
| React component | Vitest + `@testing-library/react` |
| User journey | Playwright `e2e/*.spec.ts` — tag with UAT IDs (`E2E-01`, …); see `docs/testing/uat-scenarios.md` |
| Migration / RLS | `supabase/tests/rls_*.sql` |
| Bug fix | `regression_*` test |

Use portal helpers in `e2e/helpers/portal.ts` (CI overrides; `E2E_USE_LOCAL_HOSTS=1` for subdomains). Skip OAuth/payment live flows. Golden paths require Supabase env.

## Commands

```bash
pnpm test
pnpm test:rls
pnpm test:e2e
```

If package tests fail with missing `vitest/vitest.mjs`, run `pnpm install` (see `assert-workspace-test-bins.mjs`).

Use **Vitest ≥4** (matches CI Node 24). Mock constructors with `class`, not arrow `vi.fn(() => …)` — Vitest 4 rejects arrow mocks used with `new` (e.g. `IntersectionObserver`). Auth login tests that render `RequireMembership` must mock `@/lib/supabase` (center operational status).

When mocking `@/lib/homepageApi`, use `importOriginal` and spread `...actual` so query-key constants (`MARKETING_HOMEPAGE_CONFIG_QUERY_KEY`, `MARKETING_PUBLIC_BUNDLE_QUERY_KEY`) remain defined. Never reuse the config-only key for `{ config, legalPages }` bundles — see `openspec/specs/marketing-homepage/spec.md`.

**Platform homepage media:** never treat customized `platform_settings.marketing_homepage` as legacy solely due to Novu `bgGradient` / `themeNote`. `isLegacyPlatformHomepageSeed` must return false when enterprise blocks or `brand-assets` URLs exist (`hasCustomMarketingMedia`). Same rule for brand `landing` / center `center_landing` — use `marketingMediaGuard` (`preserveCustomMarketingMediaUrls` on save; never drop `row.landing` on fallbacks). Rule: `marketing-homepage-media`. Regressions: `regression_homepageLegacySeedKeepsBrandAssets`, `regression_tenantMarketingContentPreservesBrandAssets`.

Spark Academy / Abacus Classic public lead forms live in modals — Playwright helpers: `e2e/helpers/leadModals.ts` (dialog-scoped fills; deep links `#enroll`, `#enroll-student`, `#register`, `#apply`). Mapping: `resolveLeadModalKind.ts`; hash open: `LeadModalHashOpener`. Spark skins dialogs with `ac-modal--spark` (`regression_spark_lead_modals_use_theme_classes`, `regression_spark_lead_modal_css_matches_theme_tokens`). Spark homepage motion: `regression_spark_homepage_motion_css_respects_reduced_motion`, `regression_spark_section_items_stagger_inside_blocks`. Center Path B passes `centerSlug` so enroll submits `submitCenterStudentRegistration`.

**E2E brand cleanup:** any test that approves a platform brand signup must call `cleanupEphemeralE2EBrand` (see `e2e/helpers/brandCleanup.ts`) so `/admin/brands`, `/admin/subscriptions`, and `/admin/audit` do not accumulate `E2E Brand …` rows. Prefer hard-delete via `hardDeleteEphemeralE2EBrands` (SQL or platform RPC `purge_ephemeral_e2e_brands`) — removes brands, `brand_subscriptions`, signups, and audit logs (not soft archive). Matchers: `e2eEphemeralBrand.ts`.

**E2E student lead cleanup:** any test that creates a student lead (brand Path A, center Path B, manual entry, merge, stale) must use `makeE2ELeadFields` and call `cleanupEphemeralE2ELead` in `finally` (plus suite `afterAll` + Playwright `globalTeardown`). Hard-delete via `hardDeleteEphemeralE2ELeads` — SQL when `DATABASE_URL` is set, otherwise `purge_ephemeral_e2e_leads` / `purge_ephemeral_e2e_leads_for_brand` RPC using seed platform/brand login (never no-op when Supabase anon env is present). Matchers: `e2eEphemeralLead.ts`.

Platform brand settings: theme/name/status saves must not call `brand-owner-credentials` unless login fields were intentionally edited (`BrandEditForm` `loginFieldsTouched` + `shouldSyncBrandOwnerCredentials`).

Brand `/app/settings` has no Brand Identity / logo card (`regression_brand_settings_omits_brand_identity_card`). Homepage Site logo save copies `landing.meta.logoUrl` to `brands.logo_url` (`regression_save_brand_landing_syncs_site_logo_to_brands_logo_url`); center_landing saves must not (`regression_save_center_landing_does_not_overwrite_brand_logo`).

Brand franchise centers: profile/photo saves must not call `center-owner-credentials` unless Franchise Identity login email/password were intentionally edited (`CenterDetailPanel` `loginFieldsTouched` + `shouldSyncCenterOwnerCredentials`). Brand `/app/centers` launches View Frontend/View Backend; disable/enable uses `set_franchise_center_status`; delete uses `soft_delete_franchise_center`. The detail panel has no Social Media editor (`regression_brand_centers_detail_omits_social_media_section`). Soft-deleted centers remain on Franchise Applications **Decided** with a DELETED badge (`regression_deleted_converted_inquiry_uses_decided_tab`, `regression_deleted_converted_inquiry_appears_on_decided_tab`) — do not drop inquiry history. Deleted inquiries sort after live decided rows (`regression_deleted_franchise_inquiries_sort_to_bottom_of_decided`, `regression_deleted_franchise_appears_last_on_decided`). Franchise Applications and brand Student Leads use **Pending review** / **Decided** tabs only (`regression_pipeline_list_with_filter_tabs`, `regression_student_leads_pipeline_layout`). Brand Student Leads uses the same pipeline chrome as Franchise Applications (search, KPI strip, persistent list + detail) — `regression_student_leads_list_stays_visible_with_detail`. Desktop detail stacks assignment below applicant (`regression_student_leads_detail_stacks_assignment_below_applicant`, `regression_student_leads_detail_grid_is_single_column`). Franchise Applications KPI strip is Pending review / Approved / Rejected / Total (`regression_franchise_apps_kpi_cards_match_lead_stats`). Brand Success Stories (`/app/success-stories`) uses the same pipeline chrome; KPI strip is Published / Draft / With photo / Total (`regression_success_stories_kpi_cards_match_pipeline_stats`). Brand Merchandise (`/app/merchandise`) uses the same pipeline chrome; KPI strip is Active / Draft / Orders / Total (`regression_merchandise_page_matches_franchise_apps_stats_chrome`). Catalog, Promo Codes, Orders, and Payment settings all use desktop `PipelineWorkspace` list + detail (`regression_merchandise_promo_tab_uses_catalog_pipeline_workspace`, `regression_merchandise_orders_tab_uses_catalog_pipeline_workspace`, `regression_merchandise_payment_tab_uses_catalog_pipeline_workspace`, `regression_merchandise_section_tabs_keep_catalog_workspace_chrome`). Staff AppShell tab changes scroll to the top (`regression_staff_app_scrolls_to_top_on_tab_change`). The mobile top bar shows the tenant Site logo beside the product name (`regression_staff_mobile_bar_shows_brand_logo`).

Franchise CSV import: platform `/admin/brands/:slug` and brand `/app/centers` share `FranchiseCenterImportDialog`; required CSV columns are `name` and `city`; slug is derived from name (`deriveFranchiseCenterSlug` + RPC) then `import_franchise_centers` (`is_platform_admin` or `has_brand_access`) — see `docs/ops/franchise-center-csv-import.md`.

Center public footer social: `regression_center_landing_footer_uses_brand_social_connect` and `regression_center_settings_omits_social_presence` — icons use brand `social_connect`; center Settings has no **+ Add social link**. Save still passes through `franchise_centers.social_links` (`regression_center_settings_save_passthrough_social_links`).

Center public footer contact: `regression_center_footer_contact_uses_franchise_profile_not_brand_hq`, `regression_center_footer_replaces_brand_head_office_with_franchise_contact`, `regression_center_footer_uses_franchise_phone_not_placeholder`, `regression_novu_center_footer_shows_franchise_contact_not_presence` — Novu / Abacus / Spark overlay Franchise Management address and phone.

Center public footer name: `regression_center_footer_replaces_sample_center_placeholder_with_franchise_name` and `regression_center_public_footer_uses_franchise_name_not_sample_center` — never show editor placeholder **Sample Center** on a live center host.

Center public mentors: `regression_center_mentors_show_franchiser_first_then_brand_founder` and `regression_center_mentors_brand_owner_first_when_franchiser_missing` — franchiser card first when Franchise Identity has an owner/photo; brand founder always remains; brand owner is first when the franchiser is missing (`regression_center_public_mentors_use_franchiser_then_brand_founder`).

Center public nav lockup: `regression_franchise_frontend_nav_highlights_logo_and_name` — franchise frontend enlarges brand logo and site name (`--franchise` nav modifier).

Curriculum course banner: `regression_curriculum_banner_shows_upload_size_hint` and `regression_curriculum_banner_rejects_images_over_5mb` — dropzone shows formats, 5 MB max, 1280×720; oversized images rejected.

Curriculum parent marketing: `regression_created_course_shows_parent_marketing_fields` and `regression_created_course_parent_marketing_is_editable` — after create, `/app/curriculum` course detail still shows Add benefit, Why parents choose this, Skills and outcomes, and **Save**.

Curriculum live toggle: `regression_curriculum_course_live_toggle_is_visible` and `regression_curriculum_course_live_toggle_turns_course_off` — brand `/app/curriculum` course **detail** (column 2) has an on/off switch next to the Active badge and **Save** (`programs.is_active`), right-aligned in the header (`regression_curriculum_detail_save_group_aligns_right`); the Courses list has no toggle. Off courses stay in the list and drop from public programs / batch pickers. Course title uses 50% of the header on desktop (`regression_curriculum_detail_title_uses_half_width`); mobile stacks the title above the toggle and Save (`regression_curriculum_mobile_active_course_opens_editable_detail`). Desktop add is **+ Add Curriculum** in the page header only — the Courses list has no **+** (`regression_courses_list_has_no_add_plus_button`). Page chrome matches Franchise Applications with Active/Drafts/Programs/Total KPIs (`regression_curriculum_page_matches_franchise_apps_stats_chrome`).

Center Leads / Students / Fees / Inventory / Merchandise match that Curriculum chrome: Open / Converted / Lost / Total (`regression_center_leads_pipeline_workspace_theme`); Linked / Unassigned / Programs / Total (`regression_center_students_page_matches_curriculum_stats_chrome`); Outstanding / Paid / Overdue / Total (`regression_center_fees_page_matches_curriculum_stats_chrome`); In stock / Low stock / Incoming / Total (`regression_center_inventory_page_matches_curriculum_stats_chrome`); Catalog / Unpaid / Orders / Total (`regression_center_merchandise_page_matches_curriculum_stats_chrome`). Assert **Add invoice** before switching to Payments (that tab hides the add form).

Spark Academy public courses: `regression_spark_courses_use_published_curriculum_over_homepage_cards` — **Courses designed for success** lists published `/app/curriculum` programs even when leftover `programsSection` cards exist. Published syllabus still shows when leftover `programsGrid` is off (`regression_spark_courses_show_published_syllabus_even_if_programs_grid_off`). Course cards center in the row (`regression_spark_course_cards_center_in_grid`). Course cards keep **Enroll now** only (no **Enroll** price/link) and center the rating below the button (`regression_spark_course_card_keeps_enroll_now_and_centers_rating_below`). The section has no **All courses** / course-name tabs (`regression_spark_courses_section_has_no_curriculum_tabs`).

Spark Academy public footer: `regression_spark_footer_is_column_layout_without_newsletter` — column grid (brand, Explore, Contact, presence); no email/newsletter form. Leftover Novu `footerCta` “Start your network differently.” is not rendered (`regression_spark_footer_hides_novu_newsletter_cta`).

Spark Academy nav Link dropdown: `regression_spark_nav_dropdown_omits_duplicate_programs_and_about_us` — no `Programs (#programs)` / `About us (#features)`; use Courses + Features. `#curriculum` maps to `#programs` (`regression_spark_curriculum_alias_maps_to_courses_option`). Public Spark nav comes from **Navigation & CTAs** — no hardcoded brand Login (`regression_spark_nav_omits_hardcoded_login_on_brand_site`, `regression_spark_nav_login_comes_from_navigation_ctas`), secondary franchise CTA in the desktop header and, on `max-width: 1023px`, only in the themed left-hand drawer (`regression_spark_nav_shows_secondary_cta_from_navigation`, `regression_spark_mobile_secondary_cta_header_uses_drawer_only_class`, `regression_spark_nav_drawer_css_uses_theme_tokens_and_hides_header_secondary`). Drawer lockup shows Site logo then brand name (`regression_spark_drawer_shows_logo_before_brand_name`), and no auto-injected About Us (`regression_spark_does_not_inject_about_nav`). Franchise drawer keeps **Student Login** and omits the secondary franchise CTA (`regression_spark_drawer_uses_student_login_on_franchise`, `regression_spark_nav_omits_secondary_cta_on_franchise`). Public `#gallery` uses homepage Photo gallery images (`regression_spark_photo_gallery_renders_homepage_images`); desktop is a wrapping grid and mobile is a two-row auto-scroll carousel (`regression_spark_gallery_mobile_carousel_markup`, `regression_spark_gallery_mobile_autoscroll_advances`). Features floats sit on visual corners (`regression_spark_features_floats_sit_on_visual_corners`). Mentor cards in **Meet Our Expert Mentors** are centered in the track (`regression_spark_mentors_center_in_track`). Success stories cards are centered in the testimonials row on desktop (`regression_spark_testimonials_center_in_grid`) and become a mobile auto-scroll carousel (`regression_spark_testimonials_mobile_carousel_markup`, `regression_spark_testimonials_mobile_autoscroll_advances`). Public `/about` uses `.about-us--spark-academy` + Spark CTAs (`regression_spark_about_page_uses_spark_theme_classes`) and scrolls to the top on load (`regression_about_page_scrolls_to_top_on_load`). Spark homepage omits the About teaser (`regression_spark_homepage_omits_about_teaser_sections`); leftover `#about` nav rewrites to `/about` (`regression_spark_rewrites_about_hash_nav_to_about_page`). Section titles share `--sa-h2-*` (`regression_spark_section_headings_share_type_scale`, `regression_spark_section_headings_use_shared_title_class`). Hero Course and Features Last month / Learning Progress floats stay inside the photo stage (`regression_spark_hero_course_float_anchors_to_photo_stage`, `regression_spark_features_floats_anchor_to_photo_stage`). Homepage **Save changes** stays enabled when clean (`regression_homepage_save_stays_enabled_when_clean`). Navigation CTA labels must not persist on type or copy into the hero (`regression_nav_cta_labels_do_not_persist_on_type`). Hero CTA label/link are independent of the header Primary CTA (`regression_hero_cta_is_independent_of_nav_primary`, `regression_spark_hero_uses_hero_cta_not_nav`).

Brand center enrollment template: `regression_center_site_config_is_its_own_page` — **Center Site Configuration** is `/app/center-site`, not a panel on `/app/homepage`.

Franchise public programs: `regression_center_public_programs_filter_to_enabled_curriculum` — center WHAT WE TEACH / courses show only `center_program_enablement` programs, not the full Center sites template.

Manual student lead: `regression_manual_brand_student_matches_public_enroll_fields` and `regression_manual_center_student_matches_public_register_fields` — Add Lead is a modal (`ed-import-dialog`), same pattern as Add Franchise.

Coverage target: ≥80% on `packages/*`.

## Before finish

Run skill **`edunudg-sync-artifacts`**: update OpenSpec, docs, tests, skills/rules, and agent briefs for the change type. Standing rules: `artifact-sync`, `agent-boundaries`.

## Accessible name queries (Playwright vs Testing Library)

Both need **exact** matching when labels share a prefix (`Log in` vs `Log in with Google`), but the APIs differ:

| Library | Exact match |
|---------|-------------|
| **Playwright** (`e2e/`) | `{ name: "Log in", exact: true }` |
| **Testing Library** (Vitest) | `{ name: exactAccessibleName("Log in") }` → `/^Log in$/` |

**Never** pass `{ exact: true }` to Testing Library `getByRole` — it is not on `ByRoleOptions` and **fails `pnpm typecheck`**. Helper: `apps/web/src/test/exactAccessibleName.ts`.

Spec: `openspec/specs/staff-login/spec.md`. Regressions: `e2e/platform-smoke.spec.ts`, `apps/web/src/test/exactAccessibleName.test.ts`.
