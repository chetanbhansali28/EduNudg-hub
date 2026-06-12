## Context

EduNudg is a multi-tenant franchise learning OS (Vite SPA + Supabase). The learn portal resolves `brand_id` from `learn.{brand}` hostname. Today:

- [`get_student_learn_dashboard`](../../../supabase/migrations/026_phase_d_kits_student_learn.sql) gates on `is_parent_of_student()` — not student auth
- UI: [`StudentDashboardPage`](../../../apps/web/src/features/learn/StudentDashboardPage.tsx) (2 plain cards), [`StudentProfilePage`](../../../apps/web/src/features/learn/StudentProfilePage.tsx) (auth name/email only)
- Schema exists for `student_level_progress`, `student_assessments`, `brand_competitions`, `student_competition_entries` but is loosely coupled (free-text levels, no registration workflow, assessments hidden from learn portal)
- Convert RPC creates student + enrollment at center but does not link student auth or invite portal access

Tenant chain: Platform → Brand → Franchise Center → Student (via active enrollment). All academic data must remain enrollment-scoped per [`forbidden-patterns.md`](../../../docs/agent-playbook/forbidden-patterns.md).

## Goals / Non-Goals

**Goals:**

- Student logs in at `learn.{brand}` and sees a **comprehensive dashboard** in one RPC round-trip
- Every learn-portal student is **always tied to an active center enrollment**
- Curriculum ladder, exam/assessment history, competition calendar, free self-enroll, past results
- Center transparency card (name, contact, public URL) on dashboard and profile
- Free competition enrollment end-to-end; paid events show **Coming soon** consistently
- Smooth data flow: center writes progress → student sees it; brand defines competitions → student enrolls

**Non-Goals:**

- Parent portal on `parents.*` (defer; remove parent gate from learn RPC)
- Paid competition checkout / payment gateway integration
- Kit/merchandise visibility on learn portal (FR-S03)
- Lesson content, practice modules, quest portal
- Student self-serve profile photo upload
- Platform admin student views (unchanged)

## Decisions

### D1: Student auth via `students.user_id` (not parent-only)

**Choice:** Add `students.user_id` FK to `auth.users`; unique per `(brand_id, user_id)`.

**Rationale:** User chose student-first login. Parent link remains in schema for future parent portal but learn RPCs resolve student by `user_id`.

**Alternative rejected:** Reuse `parents.user_id` only — wrong persona for student-first UX.

### D2: Enrollment gate as single helper RPC

**Choice:** `get_student_active_enrollment(student_id, brand_id)` used by all learn RPCs; raises `NO_ACTIVE_ENROLLMENT` if no active row with `center_id`.

**Rationale:** One enforcement point; UI shows full-page blocked state instead of empty dashboard.

### D3: Comprehensive dashboard = one aggregator RPC

**Choice:** `get_student_learn_home(brand_id)` returns full JSON contract (student, brand, enrollment, center, ladder, stats, competitions, activity).

**Rationale:** Avoid N+1 client queries; dashboard is primary landing; detail pages may call dedicated RPCs for pagination.

### D4: Academic records require `enrollment_id + center_id + brand_id`

**Choice:** NOT NULL on new writes to `student_level_progress`, `student_assessments`, `student_competition_registrations`, `student_competition_entries`.

**Rationale:** Invariant L3; enables center-scoped RLS and correct transparency attribution.

### D5: Curriculum ladder from pinned `curriculum_version_id`

**Choice:** Ladder built from `levels` ordered by `sort_order`; progress merged from `student_level_progress` by `level_id`. Fallback empty state when enrollment has no curriculum version.

**Rationale:** Aligns with published curriculum tree in `006_brand_curriculum.sql`. Center must pin version on enrollment for full ladder.

### D6: Exams = `student_assessments` with visibility flag

**Choice:** Add `visible_to_student boolean DEFAULT true`; student RPCs filter hidden rows. Terminology in UI: "Exams" maps to assessment records.

**Rationale:** Reuses existing center assessments page; no new exam definition table for v2.

### D7: Competition registration table separate from results

**Choice:** New `student_competition_registrations` for pre-event enroll; keep `student_competition_entries` for post-event results.

**Rationale:** Registration lifecycle (registered → withdrawn) distinct from results (rank, score).

### D8: `fee_type` enum on `brand_competitions`

**Choice:** `free` | `paid` (default `free`). Free: `register_student_for_competition` works. Paid: UI disabled + RPC `PAID_ENROLLMENT_NOT_AVAILABLE`.

**Rationale:** Schema reserves `fee_amount`/`fee_currency` for future payment without half-built checkout.

### D9: Single active enrollment for learn portal v2

**Choice:** If student has multiple active enrollments under same brand, use most recent `enrolled_at`. Multi-center picker deferred.

**Rationale:** Rare in abacus franchise; simplifies dashboard contract.

### D10: Center invite via Supabase auth invite

**Choice:** `invite_student_portal_access(student_id)` sends invite to `students.login_email`; `link_student_auth_user` on first login.

**Rationale:** Reuses existing auth infrastructure; center sets email at convert or on Students page.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Young students lack email | Center sets `login_email`; copy directs to contact center |
| Enrollment without curriculum | Ladder empty state + center prompt to pin `curriculum_version_id` |
| Breaking parent test login | New seed student account with `user_id`; parent path removed from learn RPC |
| Paid competition user confusion | Consistent "Coming soon" copy on dashboard and competitions page |
| Big-bang scope | Strict non-goals; tasks ordered by dependency |

## Migration Plan

1. Deploy migration: schema columns + new table + helper functions
2. Deploy RPCs (new learn aggregators + register/withdraw)
3. Backfill: existing `student_level_progress` rows get `enrollment_id` from active enrollment where possible
4. Deploy SPA with new routes
5. Update seed + test-users docs
6. Run `pnpm test` + `pnpm test:rls`

**Rollback:** Revert SPA to v1 routes; old `get_student_learn_dashboard` can remain until archive (deprecated, not called).

## Open Questions

- Multi-enrollment picker UI — defer to v2.1 unless UAT finds frequent transfers
- Attendance widget on dashboard — optional v2.1 if batch join is stable
- Brand competition admin UI location — use existing brand merchandise area or new `/app/competitions` route
