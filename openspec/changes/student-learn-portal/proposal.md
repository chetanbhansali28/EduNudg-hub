## Why

The student learn portal (`learn.{brand}`) ships as a minimal v1 (Dashboard + Profile only) with a parent-gated RPC and almost no visible data after login. Students cannot authenticate as themselves, progress and assessments recorded by centers are not surfaced, and competitions lack self-enrollment. Parents and students need a comprehensive, center-linked view of enrollment, curriculum progress, exams, and competitions to build transparency with their franchise center.

## What Changes

- Add **student-first auth**: `students.user_id`, center invite flow, first-login link RPC
- **Hard enrollment gate**: learn portal requires active `student_enrollments` with non-null `center_id`
- Replace thin dashboard with **comprehensive home** via single `get_student_learn_home` RPC (identity, center card, curriculum ladder, stats, competitions, activity)
- Add routes: `/progress`, `/competitions`, `/activity`; expand `/profile`
- **Curriculum-linked progress** with enrollment-scoped academic records
- Surface **assessments/exams** to students when `visible_to_student = true`
- **Free competition self-enrollment** with registration windows; **paid** competitions visible with "Coming soon" (no payment)
- Center: invite student portal, pin curriculum on enrollment, level dropdown for progress
- Brand: competition CRUD with `fee_type`, registration window fields
- Extend convert flow to accept optional `student_login_email`
- Rich seed data + RLS tests for student portal
- **BREAKING**: `get_student_learn_dashboard` superseded by student-auth-gated RPCs (parent path deferred to future `parents.*` portal)

## Capabilities

### New Capabilities

- `student-learn-portal`: Student-facing learn portal — auth, comprehensive dashboard, progress, exams, free/paid competition enrollment, center transparency, tenant data flow

### Modified Capabilities

- `student-leads`: Convert flow stores optional `student_login_email` on student record for portal invite

## Impact

- **Database**: migrations `047+` — `students.user_id`, `login_email`; `brand_competitions` registration + `fee_type`; `student_competition_registrations`; `student_level_progress.enrollment_id`; `student_assessments.visible_to_student`
- **RPCs**: `get_student_learn_home`, `get_student_progress_detail`, `get_student_competitions`, `get_student_profile`, `register_student_for_competition`, `withdraw_competition_registration`, `link_student_auth_user`, `invite_student_portal_access`, `get_student_active_enrollment`, `is_student_self`
- **Frontend**: `apps/web/src/features/learn/*`, `studentLearnApi.ts`, `portalNav.tsx`, `AppRoutes.tsx`
- **Center/Brand**: Students page invite, learn records card, competition admin
- **Docs**: `docs/spec/data-flow.md` Flow 8, FR-S10+, navigation spec, test-users seed
- **Tests**: `supabase/tests/rls_student_learn_portal.sql`, Vitest for learn feature
