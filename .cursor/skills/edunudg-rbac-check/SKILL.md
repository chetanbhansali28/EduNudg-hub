---
name: edunudg-rbac-check
description: Verify RBAC before adding screens or mutations. Use for new routes, buttons, or API calls.
---

# RBAC Check

1. Open `docs/rbac/permission-matrix.csv`.
2. Identify `resource` and `action` (create, read, update, delete, approve).
3. Confirm role in `memberships.role_key` is allowed.
4. Add `can()` / `canAny()` from `@edunudg/permissions` in UI. On brand/center portals, use `canAny(memberships.map(m => m.role_key), resource, action)` — **not** `can(primaryRole(…))`. `primaryRole` prefers platform and will hide brand CRUD for admins on Brand backend. Include `platform_super_admin` / `platform_ops` on brand mutation actions that RPCs already allow via `is_platform_admin()`.
5. Ensure RLS policy exists (defense in depth).
6. Update CSV if new resource/action.
