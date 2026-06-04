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
- [ ] Cross-cutting code goes in **services** or **packages/** — not feature UI files
- [ ] New integrations ship behind **feature flags** (default off)
- [ ] Payment flows use gateway abstraction — brand pays platform only for subscriptions

## Skills

- `edunudg-modular-features` for boundaries; delegate migrations to Database agent
