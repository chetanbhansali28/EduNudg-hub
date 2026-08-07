# Center Navigation (`http://{center}.{brand}.localhost:9000`)

## Public `/` (marketing landing)

**Student registration** only — brand logo in nav (no center logo), center blurb on page. Staff: `/login`. App: `/app/*`.

Details: [Portal host matrix](../spec/portal-host-matrix.md), [Prospective student journey](../journeys/prospective-student.md).

## App `/app` (authenticated)

See [Navigation spec](../spec/navigation-spec.md).

- Operations Dashboard
- **Leads** (`/app/leads`) — replaces Admissions; assign convert
- Students & Transfers
- **Batches & Schedule** (`/app/batches`) — only when brand feature flag `batches` is ON (default off)
- Fees & Payments
- **Merchandise** (`/app/merchandise`) — when brand enables `merchandise` (legacy `/app/kits` redirects)
- **Settings** (`/app/settings`) — edit public center profile (photo, address, phone, social links); login email from auth
- Assessments / Reports — Phase D
