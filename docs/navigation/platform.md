# Platform Navigation

## Public `/` (`http://localhost:9000`)

EduNudg marketing homepage + **self-serve brand signup** (B2B). No franchise or student forms. Sign-in: `/login`.

Details: [Portal host matrix](../spec/portal-host-matrix.md), [Platform brand onboarding](../journeys/platform-brand-onboarding.md).

## App `/admin` (authenticated)

See [Navigation spec](../spec/navigation-spec.md).

- Command Center (Home) — compact KPI grid
- Brands — manual signup, pending approvals, brand list; **Brand backend** / **Edit** → `/admin/brands/:slug`
- Brand detail — performance KPIs, brand settings, domains (**Open** handoff), franchise centers
- Subscriptions & Billing
- Revenue & Usage — compact KPI grid
- Audit Logs
- Platform Settings (default timezone IST)
- Homepage — EduNudg marketing editor + **brand marketing themes** (Novu / Abacus Classic)
