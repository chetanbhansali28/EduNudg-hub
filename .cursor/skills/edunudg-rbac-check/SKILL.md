---
name: edunudg-rbac-check
description: Verify RBAC before adding screens or mutations. Use for new routes, buttons, or API calls.
---

# RBAC Check

1. Open `docs/rbac/permission-matrix.csv`.
2. Identify `resource` and `action` (create, read, update, delete, approve).
3. Confirm role in `memberships.role_key` is allowed.
4. Add `can()` check from `@edunudg/permissions` in UI.
5. Ensure RLS policy exists (defense in depth).
6. Update CSV if new resource/action.
