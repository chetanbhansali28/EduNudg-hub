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
- **Append-only**: `financial_events`, `enrollment_history`, `platform_audit_logs`, `auth_audit_logs`
- **Direct INSERT blocked**: `financial_events` (ledger writes via SECURITY DEFINER RPC / service role only)
- **Self-scoped INSERT**: `auth_audit_logs` (`user_id = auth.uid()`)
- **SECURITY DEFINER RPCs**: `authenticated` only except public marketing/signup allowlist (see `028_security_rls_rpc_hardening.sql`). Always `REVOKE FROM PUBLIC, anon` before `GRANT`.
- **Function search_path**: all `public` functions must `SET search_path = public` (see `029_function_search_path_hardening.sql`).

See migrations `003_rls_helpers.sql` through `008_finance_analytics.sql`.
