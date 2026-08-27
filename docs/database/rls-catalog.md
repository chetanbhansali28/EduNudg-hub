# RLS Catalog

## Helper functions

| Function | Purpose |
|----------|---------|
| `is_platform_admin()` | Platform super_admin / ops |
| `has_brand_access(uuid)` | Brand or platform scope |
| `has_center_access(uuid)` | Center, brand admin, or platform |
| `user_brand_ids()` | Set of accessible brand IDs |
| `user_center_ids()` | Set of accessible center IDs |

## Policy patterns

- **Platform tables**: `is_platform_admin()` for mutations; read where noted
- **Brand-scoped**: `has_brand_access(brand_id)`
- **Center-scoped**: `has_center_access(center_id)`
- **domain_mappings**: public read for hostname resolution
- **Append-only**: `financial_events`, `enrollment_history`, `platform_audit_logs`, `auth_audit_logs`, `access_audit_logs`, `client_error_reports`
- **Direct INSERT blocked**: `financial_events` (ledger writes via SECURITY DEFINER RPC / service role only)
- **Self-scoped INSERT**: `auth_audit_logs` (`user_id = auth.uid()`)
- **SECURITY DEFINER RPCs**: `authenticated` only except public marketing/signup allowlist (see `028_security_rls_rpc_hardening.sql` and `100_revoke_anon_security_definer_execute.sql`). Always `REVOKE FROM PUBLIC, anon` before `GRANT`. Anon may also execute `log_auth_audit_event` (failure only) and `log_client_error_event`. Tenant audit lists use `list_tenant_staff_audit` (redacts failed-login identifiers and omits raw IP). New SECURITY DEFINER functions inherit Supabase default `anon` EXECUTE until a sweep or explicit revoke.
- **Function search_path**: all `public` functions must `SET search_path = public` (see `029_function_search_path_hardening.sql`).

See migrations `003_rls_helpers.sql` through `008_finance_analytics.sql`.
