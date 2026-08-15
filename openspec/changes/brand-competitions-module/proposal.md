## Why

Competitions were nested under Merchandise and shared the `merchandise` flag, so brands could not enable events without the catalog. Brand owners also had no way to author curriculum-scoped questions or run an online quiz for enrolled students.

## What Changes

- New brand feature flag `competitions` (default **off**), independent of `merchandise`
- Platform admin Features card on `/admin/brands/:slug` exposes a **Competitions** toggle
- Brand left nav item **Competitions** → `/app/competitions` (Events + Question bank); Merchandise tab removed
- Question bank tagged to curriculum course + level (MCQ, 2–6 options, one or more correct answers)
- Brand attaches questions to an event by manual pick or random draw (snapshots)
- Enrolled students take a one-attempt scored quiz on the learn portal; scores write `student_competition_entries`
- Full gate when OFF: brand nav/route, student Events nav/route, RPCs, RLS

## Capabilities

### New Capabilities

- `brand-competitions-module`: Per-brand Competitions module (admin toggle, nav split, question bank, student quiz)

### Modified Capabilities

- `student-learn-portal`: Events nav gated by `competitions`; take quiz; scores from quiz attempts

## Impact

- `brand_settings.settings.features.competitions`
- Brand portal: `/app/competitions`; Merchandise no longer hosts competitions
- Learn portal: `/competitions` and home upcoming events
- RPCs: existing competition CRUD/register plus bank/quiz RPCs
- New tables: question bank, snapshots, attempts, answers
