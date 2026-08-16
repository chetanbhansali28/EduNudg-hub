# Center Navigation (`http://{center}.{brand}.localhost:9000`)

## Public `/` (marketing landing)

**Student registration** only — brand logo in nav (no center logo), center blurb on page. Staff: `/login`. App: `/app/*`.

Details: [Portal host matrix](../spec/portal-host-matrix.md), [Prospective student journey](../journeys/prospective-student.md).

## App `/app` (authenticated)

See [Navigation spec](../spec/navigation-spec.md).

- Operations Dashboard
- **Leads** (`/app/leads`) — Curriculum-style pipeline chrome (Open / Converted / Lost / Total KPIs), search, convert, CSV import
- **Students** (`/app/students`) — same chrome (Linked / Unassigned / Programs / Total)
- **Batches & Schedule** (`/app/batches`) — only when brand feature flag `batches` is ON (default off)
- **Fees & Payments** (`/app/fees`) — same chrome (Outstanding / Paid / Overdue / Total); Invoices / Payments tabs
- **Merchandise** (`/app/merchandise`) — when brand enables `merchandise` (legacy `/app/kits` redirects)
- **Settings** (`/app/settings`) — edit public center profile (photo, address, phone); login email from auth; public footer social uses brand Social Media Connect
- Assessments / Reports — Phase D
