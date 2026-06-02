---
name: edunudg-write-tests
description: Write tests for EduNudg features and bugfixes. Required for every PR.
---

# Write Tests

| Change | Tests |
|--------|-------|
| `packages/*` logic | Vitest `*.test.ts` |
| React component | Vitest + `@testing-library/react` |
| User journey | Playwright `e2e/*.spec.ts` |
| Migration / RLS | `supabase/tests/rls_*.sql` |
| Bugfix | `regression_*` test |

## Commands

```bash
pnpm test
pnpm test:rls
pnpm test:e2e
```

Coverage target: ≥80% on `packages/*`.
