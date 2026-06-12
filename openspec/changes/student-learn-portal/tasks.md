## 1. OpenSpec & docs traceability

- [ ] 1.1 Validate change: `pnpm exec openspec validate student-learn-portal --strict`
- [ ] 1.2 Add Flow 8 to [`docs/spec/data-flow.md`](../../../docs/spec/data-flow.md) (student portal access sequence)
- [ ] 1.3 Add FR-S10 through FR-S21 to [`docs/spec/functional-requirements.md`](../../../docs/spec/functional-requirements.md)
- [ ] 1.4 Update [`docs/spec/navigation-spec.md`](../../../docs/spec/navigation-spec.md) learn portal nav (Dashboard, Progress, Competitions, Activity, Profile)
- [ ] 1.5 Update [`docs/database/table-dictionary.md`](../../../docs/database/table-dictionary.md) for new columns/tables

## 2. Database migration — auth & enrollment gate

- [ ] 2.1 Add `students.user_id`, `students.login_email` with unique index on `(brand_id, user_id)`
- [ ] 2.2 Create `is_student_self(student_id, brand_id)` helper
- [ ] 2.3 Create `get_student_active_enrollment(student_id, brand_id)` raising `NO_ACTIVE_ENROLLMENT`
- [ ] 2.4 Create `link_student_auth_user(student_id, brand_id)` RPC
- [ ] 2.5 Create `invite_student_portal_access(student_id)` RPC (center staff only)
- [ ] 2.6 Extend `convert_lead_to_student` to accept optional `student_login_email` override

## 3. Database migration — progress & assessments

- [ ] 3.1 Add `visible_to_student boolean DEFAULT true` to `student_assessments`
- [ ] 3.2 Require `enrollment_id` on new `student_level_progress` writes; update `record_student_level_progress` to accept `level_id` and resolve enrollment
- [ ] 3.3 Backfill existing progress rows with `enrollment_id` from active enrollment where possible

## 4. Database migration — competitions

- [ ] 4.1 Add to `brand_competitions`: `fee_type`, `fee_amount`, `fee_currency`, `registration_opens_at`, `registration_closes_at`, `registration_mode`, `max_participants`, `eligibility_rules`
- [ ] 4.2 Create `student_competition_registrations` table with RLS (student SELECT own; mutations RPC-only)
- [ ] 4.3 Extend `student_competition_entries` with optional `rank_position`, `score`, `enrollment_id` if missing
- [ ] 4.4 Create `register_student_for_competition(competition_id)` — free only; rejects `PAID_ENROLLMENT_NOT_AVAILABLE`, `REGISTRATION_CLOSED`
- [ ] 4.5 Create `withdraw_competition_registration(registration_id)` RPC
- [ ] 4.6 Update `upsert_brand_competition` for new registration and fee fields

## 5. Student read RPCs

- [ ] 5.1 Implement `get_student_learn_home(brand_id)` per dashboard JSON contract in design.md
- [ ] 5.2 Implement `get_student_progress_detail(brand_id)` with curriculum ladder merge logic
- [ ] 5.3 Implement `get_student_competitions(brand_id, filter)` — upcoming | registered | past
- [ ] 5.4 Implement `get_student_profile(brand_id)`
- [ ] 5.5 Deprecate or remove client usage of `get_student_learn_dashboard` (parent path)

## 6. RLS tests

- [ ] 6.1 Add `supabase/tests/rls_student_learn_portal.sql` — enrollment gate, cross-student denial, free vs paid register
- [ ] 6.2 Run `pnpm test:rls` and fix policy gaps

## 7. Center & brand admin

- [ ] 7.1 Center Students page: "Invite to student portal" action + set `login_email`
- [ ] 7.2 Center Students page: pin `curriculum_version_id` on enrollment
- [ ] 7.3 Center [`CenterStudentLearnRecordsCard`](../../../apps/web/src/features/center/learn/CenterStudentLearnRecordsCard.tsx): level dropdown from curriculum; pass `level_id`
- [ ] 7.4 Center: view competition registrations for their center
- [ ] 7.5 Brand: competition CRUD UI with registration window + `fee_type` (free/paid)

## 8. Learn portal frontend — API layer

- [ ] 8.1 Extend [`studentLearnApi.ts`](../../../apps/web/src/lib/studentLearnApi.ts) with typed `StudentLearnHome` matching RPC contract
- [ ] 8.2 Add `studentProgressApi.ts`, `studentCompetitionsApi.ts` wrappers
- [ ] 8.3 Handle RPC error codes: `NO_ACTIVE_ENROLLMENT`, `REGISTRATION_CLOSED`, `PAID_ENROLLMENT_NOT_AVAILABLE`

## 9. Learn portal frontend — pages

- [ ] 9.1 Replace [`StudentDashboardPage`](../../../apps/web/src/features/learn/StudentDashboardPage.tsx) with comprehensive `StudentHomePage` (all widget groups + loading/empty/error states)
- [ ] 9.2 Add `StudentProgressPage` at `/progress`
- [ ] 9.3 Add `StudentCompetitionsPage` at `/competitions` (free enroll + paid Coming soon)
- [ ] 9.4 Add `StudentActivityPage` at `/activity`
- [ ] 9.5 Expand [`StudentProfilePage`](../../../apps/web/src/features/learn/StudentProfilePage.tsx) with enrollment + center card
- [ ] 9.6 Add `StudentEnrollmentBlockedPage` for `NO_ACTIVE_ENROLLMENT`
- [ ] 9.7 Update [`studentNavSections()`](../../../apps/web/src/lib/portalNav.tsx) and [`AppRoutes.tsx`](../../../apps/web/src/routes/AppRoutes.tsx)

## 10. Tests & seed

- [ ] 10.1 Vitest: dashboard renders all widget groups from mock payload
- [ ] 10.2 Vitest: paid competition shows Coming soon; enroll button disabled
- [ ] 10.3 Vitest: free enroll + withdraw flows
- [ ] 10.4 Vitest: `NO_ACTIVE_ENROLLMENT` blocked page
- [ ] 10.5 Seed: student auth user with `students.user_id`, Koramangala enrollment, curriculum pinned, 3/8 levels, 5 assessments, 1 free + 1 paid upcoming competition, 2 past results
- [ ] 10.6 Update [`docs/ops/test-users.md`](../../../docs/ops/test-users.md)
- [ ] 10.7 Run `pnpm test` full suite

## 11. Archive

- [ ] 11.1 UAT against success criteria in proposal
- [ ] 11.2 Run `/opsx:archive` to merge specs into `openspec/specs/`
