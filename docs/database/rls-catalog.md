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

See migrations `003_rls_helpers.sql` through `008_finance_analytics.sql`.
