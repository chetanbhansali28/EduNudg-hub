## 1. OpenSpec + flag catalog

- [x] 1.1 Change artifacts and main spec `brand-competitions-module`
- [x] 1.2 Delta `student-learn-portal` (gated Events + quiz)

## 2. Database

- [x] 2.1 Migration `081`: `brand_feature_enabled` default-off for `competitions`; retarget competition RPCs
- [x] 2.2 Tables: bank, options, snapshots, attempts, answers + RLS + audit
- [x] 2.3 Bank/attach/quiz RPCs; wrap learn home when flag off
- [x] 2.4 RLS tests

## 3. Brand SPA

- [x] 3.1 Features toggle + `FEATURE_FLAG_DEFAULTS`
- [x] 3.2 Nav + `/app/competitions` route; remove Merchandise tab
- [x] 3.3 Events section + question bank + attach/random UI

## 4. Learn SPA

- [x] 4.1 Load brand flags on learn; hide Events + FAB + route
- [x] 4.2 Take quiz / resume / review after submit

## 5. Docs / tests / sync

- [x] 5.1 Feature-flags, navigation, ERD, table dictionary, RBAC, FR-S22
- [x] 5.2 Vitest (nav, merchandise regression, scoring, student Events hide)
