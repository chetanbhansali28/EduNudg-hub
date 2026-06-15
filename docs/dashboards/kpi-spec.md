# Dashboard KPIs (MVP)

Staff dashboards render KPIs via `KpiGrid` + `KpiCard` from `@edunudg/ui`. Inside `AppShell` (`ed-shell--backend`), cards use the **compact backend theme** (see [ui-shell-standards.md](../spec/ui-shell-standards.md)).

## Platform

Command Center (`/admin`), Revenue (`/admin/revenue`), brand detail performance card (`/admin/brands/:slug`).

MRR, active/suspended brands, total centers, total students, churn-risk brands, MAU by portal.

## Brand

Home (`/app`), Analytics (`/app/analytics`): active centers, net enrollments (30d), revenue, royalty due, curriculum drafts pending, center rankings, unassigned/stale leads.

Platform brand detail: 30d royalty, enrollments, centers active/total, leads, unpaid invoices, subscription plan (no duplicate “centers listed” / hostname KPIs — see Domains section).

## Center

Home (`/app`): today's schedule layout — open leads (+today), batches today (next session), pending/overdue fees, live & upcoming batch cards, action items, system status. Legacy KPI helpers remain in `centerDashboardStats.ts` for fee rate computation.
