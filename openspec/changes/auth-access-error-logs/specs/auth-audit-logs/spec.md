# auth-audit-logs

Auth session events for audit, compliance, and support.

## Requirements

### Requirement: Auth events are append-only and tenant-tagged

The system SHALL record `login_success`, `login_failure`, `logout`, and `access_denied` on `auth_audit_logs` with portal (`platform` | `brand` | `center` | `learn` | `parents`) and optional `brand_id` / `center_id`. Rows SHALL NOT be updated by clients except service-role network metadata (IP fields). Passwords and tokens MUST NOT be stored.

#### Scenario: Successful staff login is recorded once per session

- **GIVEN** a user completes sign-in and receives a Supabase session
- **WHEN** the SPA hydrates or refreshes tokens for that same `session_id`
- **THEN** at most one `login_success` row exists for that `session_id` in a 12-hour window

#### Scenario: Failed password does not create a session

- **GIVEN** an anonymous visitor submits a wrong password on `/login`
- **WHEN** Supabase returns an auth error
- **THEN** a `login_failure` row is stored with `user_id` null and an identifier hash
- **AND** the visitor is not signed in

#### Scenario: Membership denial is audited

- **GIVEN** a signed-in user without membership for the current portal
- **WHEN** the login page signs them out
- **THEN** an `access_denied` event is recorded for that user and portal

### Requirement: Platform audit UI shows an Auth stream

Platform `/admin/audit` SHALL list `auth_audit_logs` alongside `platform_audit_logs`, `access_audit_logs`, and `client_error_reports`. Platform super admin and platform ops MAY filter by stream (All / Mutations / Auth / Access / Errors) and portal (All / Staff / Learn / Parent). Full `ip_address` MAY appear only on this platform surface, and only when Edge Function `auth-audit` stamped the row. RPC fallback rows SHALL show **Not captured** instead of a blank dash. The detail footer SHALL copy the selected entry as JSON (**Copy JSON**); it SHALL NOT be a no-op **Full Audit Trail** control.

#### Scenario: Auth filter hides subscription mutations

- **GIVEN** mixed mutation and auth rows
- **WHEN** the operator chooses stream Auth
- **THEN** subscription and brand-signup mutation rows are hidden
- **AND** login/logout/failure/denied rows remain

#### Scenario: Large audit lists paginate and search

- **GIVEN** about 1500 matching audit rows
- **WHEN** the operator opens `/admin/audit`
- **THEN** the table SHALL show 25 rows by default with page size 25 / 50 / 100
- **AND** the pager SHALL show `Page N of M`
- **AND** a search field SHALL filter by email, action, IP, or portal


### Requirement: Audit must not block authentication

If the audit RPC or Edge Function fails, sign-in, sign-out, and access-denied handling SHALL still complete and SHALL NOT surface audit errors as login failures.

#### Scenario: RPC outage during login

- **GIVEN** `log_auth_audit_event` returns an error
- **WHEN** the user signs in with a valid password
- **THEN** the session is created and the user proceeds

### Requirement: Fatal SPA errors are platform-only

The system SHALL record fatal client errors on `client_error_reports` via `log_client_error_event` from the ErrorBoundary, `window.onerror`, and `unhandledrejection`. Brand and center audit UIs SHALL NOT list error reports. Ordinary `console.error` calls SHALL NOT be ingested.

### Requirement: Sensitive access is logged and tenant-visible

CSV exports, Copy Profile URL, owner-credential saves, and platform portal handoff SHALL write `access_audit_logs`. Brand `/app/audit` and center `/app/audit` SHALL list Auth + Access through `list_tenant_staff_audit` without raw IP or failed-login emails.
