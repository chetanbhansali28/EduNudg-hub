# UAT scenario registry

Maps checklist IDs to automation layer. Update `status` / `test file` as coverage lands.

**Locked decisions:** converted WhatsApp re-apply rejects; lost re-apply auto-reopens; learn nav = production routes; hybrid hosts (CI overrides / local `E2E_USE_LOCAL_HOSTS=1`); pyramid; SQL stale backdate; skip OAuth/payments.

| id | layer | status | test file / notes |
|----|-------|--------|-------------------|
| E2E-01 | e2e | partial | `e2e/e2e-01-brand-onboarding.spec.ts` (needs backend; hard-deletes ephemeral brand + audit after approve) |
| E2E-02 | e2e | partial | `e2e/e2e-02-franchise-to-center.spec.ts` |
| E2E-03 | e2e | partial | `e2e/e2e-03-lead-path-a.spec.ts` |
| E2E-04 | e2e | partial | `e2e/e2e-04-lead-path-b.spec.ts` |
| E2E-05 | e2e | partial | `e2e/e2e-05-lost-reopen.spec.ts` |
| E2E-06 | e2e | partial | `e2e/e2e-06-stale-reassign.spec.ts` (+ SQL helper) |
| E2E-07 | e2e+rls | partial | `e2e/e2e-07-whatsapp-merge.spec.ts`; `rls_franchise_student_journey.sql` |
| E2E-08 | e2e | partial | `e2e/e2e-08-manual-entry.spec.ts` |
| E2E-09 | e2e | partial | `e2e/e2e-09-learn-portal.spec.ts` |
| E2E-10 | e2e | partial | `e2e/e2e-10-center-public-profile.spec.ts` |
| P-PUB-01 | e2e | done | `e2e/platform-smoke.spec.ts` |
| P-PUB-02 | e2e | done | `e2e/p-pub-forms.spec.ts` |
| P-PUB-03 | e2e | done | `e2e/p-pub-forms.spec.ts` |
| P-01..P-17 | vitest | partial | platform feature `*.test.tsx` — expand in PR-F |
| B-PUB-01..06 | e2e+vitest | partial | brand public + marketing tests |
| B-01..B-30 | vitest | partial | brand feature tests; B-26 checkout = manual-skip |
| C-PUB-01..04 | e2e | partial | center public in E2E-02/04/10 |
| C-01..C-31 | vitest | partial | center feature tests; C-25 payment = manual-skip |
| S-01..S-08 | e2e+vitest | partial | learn portal; production nav (not Dashboard+Profile-only) |
| S-X01..S-X02 | manual-skip | out-of-scope | Phase 2 parents / self-serve convert |
| NEG-01..10 | e2e+rls | partial | `e2e/neg-critical.spec.ts` |
| FF-01..03 | vitest | partial | `useFeatureFlag` / nav tests |
| UX-01..08 | e2e+vitest | partial | smoke + component; UX-05 mobile later |
| NAV-01..05 | vitest | partial | portalNav tests |
| AUTH-01..07,09..10 | e2e | partial | `e2e/auth-critical.spec.ts` |
| AUTH-08 | manual-skip | skip | Google OAuth (C7) |
| SEC-01..04 | rls+e2e | partial | RLS primary; smoke E2E |

## Commands

```bash
pnpm test          # Vitest
pnpm test:rls      # SQL journey / RLS
pnpm test:e2e      # Playwright (CI: portal overrides)
E2E_USE_LOCAL_HOSTS=1 pnpm test:e2e   # local subdomain UAT
```

Golden paths skip unless `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` are set (see `apps/web/.env`). Stale backdate needs `DATABASE_URL` or `SUPABASE_DB_PASSWORD`.
