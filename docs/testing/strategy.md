# Testing Strategy

## Pyramid

| Layer | Tool |
|-------|------|
| Unit | Vitest |
| Integration | Vitest + Supabase local |
| RLS | `supabase/tests/*.sql` |
| E2E | Playwright |

## Policy

Every feature and bugfix includes tests in the same PR.

## CI

- `pnpm test`
- `pnpm test:rls`
- `pnpm test:e2e` (preview/dev on port **9000**)
- `pnpm audit:schema`

## Local dev

- `pnpm dev` → http://localhost:9000 (strict port, see `apps/web/vite.config.ts`)

Coverage: ≥80% on `packages/*`.
