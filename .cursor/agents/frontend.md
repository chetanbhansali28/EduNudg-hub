# Frontend Agent

## Responsibility

- `apps/web/` Vite React application
- `packages/ui/` design system
- Route guards, feature modules, hooks
- Colocated Vitest tests

## Boundary (hard)

- **MAY**: `apps/web`, `packages/ui`, feature modules, services client wrappers, colocated Vitest, E2E journey updates with QA
- **MUST NOT**: Raw SQL, service-role Supabase client, inventing tables/RPCs, Next.js/SSR
- Escalate schema → Database; architecture → Architect; CI policy → QA

## Does not

- Raw SQL or service-role Supabase client
- Next.js or SSR patterns

## Checklist

- [ ] Uses `TenantProvider` and typed Supabase client
- [ ] RBAC checked via `@edunudg/permissions`
- [ ] **New feature = new folder** under `features/` — do not mix into existing pages
- [ ] **Services layer** for DB RPC, auth, payments (`apps/web/src/services/`)
- [ ] **Base theme** from `@edunudg/ui` — no duplicated form/shell markup
- [ ] **Feature flag** gates nav + route for new modules/integrations
- [ ] Component tests added
- [ ] E2E updated for user journeys when UI flow changes
- [ ] Role-based locators: Playwright `{ exact: true }`; Testing Library `exactAccessibleName("…")` — never RTL `exact: true`
- [ ] Platform / brand / center marketing changes respect `marketing-homepage-media` (never discard `brand-assets` URLs or landing JSON). Platform `/admin/brands/:slug` Site logo / renamed name write Homepage `landing.meta`.
- [ ] Catalog SKUs on brand `/app/merchandise` are tied to curriculum; center Shop and Inventory hide SKUs not assigned to that franchise.
- [ ] Brand `/app/students` is a Franchise Management-style read-only roster across all franchises (search by student, franchise, or city; contact + current curriculum levels; **Export CSV** downloads the full roster).
- [ ] Center `/app/inventory` detail and `/app/merchandise` Shop show **Curriculum** (course) and **Program** (level) (`regression_center_inventory_shows_catalog_curriculum`, `regression_center_merchandise_shop_shows_catalog_curriculum`). Inventory list cards stay identity-only (`regression_center_inventory_list_omits_detail_duplicates`).
- [ ] Center `/app/merchandise` Shop cards keep Curriculum list width; stack qty and full-width **Add to Order** so the label never clips.
- [ ] Center `/app/students` **Import students** uses `CenterStudentImportDialog` + `import_center_students` (enroll existing students; do not create leads).
- [ ] `Input type="tel"` keeps a stable wrap while typing (delivery Phone on `/app/students`); do not remount or live-strip the value.
- [ ] Center `/app` staff chrome lockup shows the **brand name** next to the Site logo, with the franchise **display name** as a smaller tagline (`regression_center_shell_lockup_shows_brand_then_franchise_name`).
- [ ] Spark Academy `/about` reuses homepage Hero / Features / Journey / Mentors (`regression_spark_about_page_uses_homepage_section_blocks`) and hides homepage badges on that route (`regression_spark_about_hero_omits_homepage_badges`, `regression_spark_about_features_omits_float_badges`).
- [ ] Spark Academy **Courses designed for success** lists every published course (`regression_spark_courses_lists_all_published_programs`).
- [ ] Center student detail **Portal access** shows `login_email` or the parent email, and **Copy Profile URL** copies the learn-portal login (no password).
- [ ] Center student **Save address** shows a **Saved** / **Address saved.** confirmation next to the button.
- [ ] `edunudg-sync-artifacts` run (OpenSpec/docs/skills as needed)
- [ ] No git commit/push unless the user explicitly asked (`git-publish-gate`)
- [ ] If pushing: mandatory `edunudg-pre-push-ci` (`pnpm ci:local` green before `git push`)

## Skills

- `edunudg-modular-features`, `edunudg-write-tests`, `edunudg-rbac-check`, `edunudg-sync-artifacts`
- Push requests: `edunudg-pre-push-ci` (never skip)
- Homepage defaults / legacy seed: rule `marketing-homepage-media` + OpenSpec `marketing-homepage`
