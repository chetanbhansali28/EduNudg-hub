## Context

Competitions live as `brand_competitions` with student enroll (`student_competition_registrations`) and staff-recorded results (`student_competition_entries`). Brand CRUD was a Merchandise tab gated by `merchandise`. Curriculum is `programs` → `levels` with no question tables. Learn portal `useBrandFeatureFlags` does not load flags today.

## Goals / Non-Goals

- **Goals:** Independent `competitions` flag (default off); brand nav page; reusable MCQ bank by course/level; snapshot attach (manual or random); one-attempt student quiz; hide student Events when off.
- **Non-Goals:** Paid quiz checkout, time limits, shuffle, retakes, mixing levels in one random draw, eligibility by student’s current level.

## Decisions

1. **Default off** — Client `FEATURE_FLAG_DEFAULTS.competitions = false`; SQL `brand_feature_enabled` special-cases `competitions` like `batches`.
2. **Decouple from merchandise** — `upsert_brand_competition` / `delete_brand_competition` / student register-list RPCs guard on `competitions`.
3. **Snapshot on attach** — `brand_competition_questions` copies prompt, options `{id,text}`, and `correct_option_ids` so bank edits do not change an in-flight paper.
4. **Lock after first attempt** — add/remove/reorder attached questions is rejected once any `student_competition_attempts` row exists.
5. **Quiz window** — registered (or confirmed), competition `is_active`, `event_date` is today or earlier (null date → available immediately). One attempt. All-or-nothing scoring (selected set equals correct set).
6. **Secrets** — students never `SELECT` `is_correct` or `correct_option_ids`; quiz payload is RPC-only. After submit, review RPC returns correctness.
7. **Learn flags** — `useBrandFeatureFlags` loads for `portalType === "learn"`. Student nav/FAB/`FeatureFlagRoute` hide `/competitions` when off. `get_student_learn_home` empties competition arrays when off.
8. **Results** — `submit_competition_attempt` upserts `student_competition_entries.score` / `max` via score field so Past results stay consistent. Center `record_student_competition_entry` remains for offline events.

## Risks / Trade-offs

- Brands already using the Merchandise Competitions tab must have the new toggle turned ON (Abacus World included).
- Wrapping `get_student_learn_home` rather than rewriting it avoids drifting from the 055 dashboard payload.
