## Why

Brand owners manage franchise centers from a single-column list with inline edit, delete, and a separate read-only detail route. There is no search, no consolidated master-detail workspace, no enforced access block when a center is suspended, and curriculum assignment is program-level only — not version-specific as franchise agreements require.

## What Changes

- Refactor `/app/centers` to **PipelineMasterDetail** (list + detail panel) with search by name/phone and status filters
- Brand can **edit all center fields** (slug read-only after provisioning); **no delete**
- **Suspend / re-enable** franchise (`status = suspended` ↔ `active`) with RPC + access enforcement
- **Version-level curriculum assignment** per center via `center_curriculum_enablement`
- Redirect `/app/centers/:slug` to `/app/centers?center={slug}`
- Student learn portal impact when franchise suspended — **deferred** (documented TODO)

## Capabilities

### New Capabilities

- `franchise-center-management`: Brand master-detail franchise workspace, suspend/re-enable, version curriculum assignment, immutable slug

### Modified Capabilities

- `franchise-applications`: Approved centers appear in new workspace (no change to approve flow)

## Impact

- **Database**: migration `052` — lifecycle RPCs, `center_curriculum_enablement`, `center_status_events`
- **RPCs**: `set_franchise_center_status`, `sync_center_curriculum_enablement`, updated `assert_center_curriculum_authorized`
- **Frontend**: `CentersPage`, `CenterDetailPanel`, `CenterCurriculumAuthPanel`, `RequireMembership`, `centerCentersApi`, `centerCurriculumApi`
- **Tests**: Vitest + `supabase/tests/rls_franchise_center_lifecycle.sql`
