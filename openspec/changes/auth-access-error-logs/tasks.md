## Phase A — Auth audit (implement now)

- [x] 1. OpenSpec proposal, design, specs, tasks
- [x] 2. Migration `097_auth_audit_events.sql`: columns, indexes, `log_auth_audit_event`, RLS grants, table dictionary
- [x] 3. RLS test `supabase/tests/rls_auth_audit_events.sql` + hardening allowlist for anon EXECUTE
- [x] 4. Edge Function `auth-audit` (IP + HMAC + country after RPC)
- [x] 5. SPA `authAuditApi` + AuthProvider (login_success deduped, logout, login_failure)
- [x] 6. LoginPage membership denied → `access_denied`
- [x] 7. Platform `/admin/audit` Auth stream + portal filter + helper mapping
- [x] 8. Vitest (API, helpers, AuthProvider, audit page) + artifact sync (docs, skills, staff-login spec)

## Phase B — Client errors (later)

- [ ] 9. `client_error_reports` + ErrorBoundary + platform Errors tab

## Phase C — Sensitive access + tenant UI (later)

- [ ] 10. Access log table + exports/PII/credentials/handoff
- [ ] 11. Brand and center `/app/audit` (masked IP)

## Phase D — Retention (later)

- [ ] 12. TTL + DPDP anonymize RPC
