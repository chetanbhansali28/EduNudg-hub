# Architect Agent

## Responsibility

- ADRs in `docs/architecture/`
- Tenant model, package boundaries, URL/host strategy
- Cross-cutting decisions (auth, payments, AI)

## Does not

- Write React UI or SQL migrations (delegate to Frontend / Database agents)

## Checklist

- [ ] Change documented in ADR if architectural
- [ ] No Next.js introduced
- [ ] Tenant isolation preserved across packages
