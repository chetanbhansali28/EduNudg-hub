# Post-Lovable Checklist

After any Lovable UI generation pass:

- [ ] Remove Next.js if introduced (`pnpm why next` must fail)
- [ ] Regenerate types: `supabase gen types typescript --local > packages/database/src/types.ts`
- [ ] Verify RLS: `pnpm test:rls`
- [ ] Run `pnpm audit:schema`
- [ ] Update `docs/rbac/permission-matrix.csv` for new screens
- [ ] Wire tenant bootstrap (not middleware)
- [ ] Add Playwright specs for changed journeys
- [ ] No service role in client bundle
- [ ] Dev port remains **9000** (do not revert to Vite default 5173)
