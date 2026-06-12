# Specification index

Authoritative docs for franchise/student journey v1. Plan: [franchise_student_journey_spec](/.cursor/plans/franchise_student_journey_spec_27f6ef6a.plan.md).

## What lives where

| Content type | Location | Notes |
|--------------|----------|-------|
| **Behavioral requirements** (what the system should do) | [`openspec/specs/`](../../openspec/specs/) | GIVEN/WHEN/THEN scenarios; edit here when behavior changes |
| **Active feature work** | [`openspec/changes/`](../../openspec/changes/) | Proposals, design, tasks, delta specs until archived |
| **API / schema reference** | This folder + [`../database/`](../database/) | RPC catalog, data-flow, ERD, table dictionary |
| **How to build safely** | [`../agent-playbook/`](../agent-playbook/), `.cursor/rules/`, `edunudg-*` skills | DoD, tenant safety, migrations |
| **Ops / runbooks** | [`../ops/`](../ops/) | Local URLs, handoff, test users |

[`functional-requirements.md`](./functional-requirements.md) is a **traceability index** (FR IDs); canonical behavior lives in `openspec/specs/`.

## Reference documents

| Document | Purpose |
|----------|---------|
| [portal-host-matrix.md](./portal-host-matrix.md) | What runs on each hostname |
| [navigation-spec.md](./navigation-spec.md) | Left sidebar menus per portal |
| [data-flow.md](./data-flow.md) | Records between platform / brand / center / student |
| [functional-requirements.md](./functional-requirements.md) | FR ID index → links to `openspec/specs/` |
| OpenSpec behavioral specs | [`openspec/specs/`](../../openspec/specs/) | GIVEN/WHEN/THEN requirements; supersedes FR tables over time |
| [rpc-catalog.md](./rpc-catalog.md) | Supabase RPC signatures |
| [data-model-extensions.md](./data-model-extensions.md) | Migration 016+ tables/columns |
| [technical-architecture.md](./technical-architecture.md) | Stack, timezone, security |
| [ui-shell-standards.md](./ui-shell-standards.md) | Responsive app layout, compact backend KPIs |
| [../dashboards/kpi-spec.md](../dashboards/kpi-spec.md) | Dashboard metrics by portal |
| [../ops/platform-admin-portal-handoff.md](../ops/platform-admin-portal-handoff.md) | Platform admin cross-portal sign-in |
| [services-layer.md](./services-layer.md) | Auth, DB, payments, integrations as services |
| [feature-flags.md](./feature-flags.md) | Module/integration ON/OFF |
| [merchandise.md](./merchandise.md) | Catalog, photos, center shop, orders, payments |
| [manual-leads.md](./manual-leads.md) | Staff manual lead / signup entry by portal |

## Journeys

- [platform-brand-onboarding.md](../journeys/platform-brand-onboarding.md)
- [franchise-owner.md](../journeys/franchise-owner.md)
- [prospective-student.md](../journeys/prospective-student.md)
- [brand-operator.md](../journeys/brand-operator.md)
- [center-enrollment.md](../journeys/center-enrollment.md) — legacy; superseded by prospective-student for v1
