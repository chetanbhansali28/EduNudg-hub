## Why

EduNudg needs an audit trail for compliance and support: who signed in or out, who performed sensitive access, and what fatal client errors occurred. Today `auth_audit_logs` exists but is almost unused (passkey only), `/admin/audit` shows platform mutations only, and the SPA has no error reporter.

## What Changes

Phased delivery:

1. **Phase A (this implementation):** session-deduped login success, explicit logout, failed password/OTP, membership denied → `auth_audit_logs`. Platform `/admin/audit` gains an **Auth** stream. Optional Edge Function `auth-audit` stamps IP hash + country (full IP for platform ops).
2. **Phase B:** React ErrorBoundary + `client_error_reports` (platform-only Errors tab).
3. **Phase C:** sensitive access log (exports, PII, credentials, handoff) + brand/center `/app/audit`.
4. **Phase D:** retention TTLs and DPDP anonymize RPC.

Decisions already locked: sensitive access only (not every route); platform sees all; brand owner/admin see own brand; center owner/manager see own center; student/parent logins share `auth_audit_logs` with a portal filter; errors stay platform-only in v1; full IP is platform-only, others see country + hash.

## Capabilities

### New Capabilities

- `auth-audit-logs`: Login/logout/failure/access-denied events and platform Auth stream.

### Modified Capabilities

- `staff-login`: failed login and membership denial SHALL write auth audit events without blocking sign-in UX.

## Impact

- Migration `097_auth_audit_events.sql`, RPC `log_auth_audit_event`, Edge Function `auth-audit`.
- `AuthProvider`, `LoginPage`, platform `AuditLogsPage`.
- Docs: auth-providers, edge-functions, table-dictionary, navigation.
- Tests: Vitest + RLS; later Playwright if the audit empty-state copy is a journey.
