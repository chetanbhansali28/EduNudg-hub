## 1. Schema

- [x] 1.1 Migration `052_franchise_center_lifecycle.sql` — lifecycle + curriculum enablement
- [x] 1.2 Backfill `center_curriculum_enablement` from existing program enablement
- [x] 1.3 RLS tests `rls_franchise_center_lifecycle.sql`

## 2. API layer

- [x] 2.1 `centerCentersApi.ts` + tests
- [x] 2.2 `centerCurriculumApi.ts` + tests
- [x] 2.3 Update `centerBatchesApi` authorized version filter

## 3. Access

- [x] 3.1 `RequireMembership` center status gate
- [x] 3.2 `CenterSuspendedPage`

## 4. UI

- [x] 4.1 `CenterDetailPanel` + `CenterCurriculumAuthPanel`
- [x] 4.2 Refactor `CentersPage` to PipelineMasterDetail
- [x] 4.3 Redirect `BrandCenterDetailPage`
- [x] 4.4 Vitest updates

## 5. Deferred

- [ ] Student learn portal when franchise suspended
- [ ] Operator notification on suspend/re-enable
