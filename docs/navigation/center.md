# Center Navigation (`http://{center}.{brand}.localhost:9000`)

## Public `/` (marketing landing)

**Student registration** only — brand logo in nav (no center logo), center blurb on page. Staff: `/login`. App: `/app/*`.

Details: [Portal host matrix](../spec/portal-host-matrix.md), [Prospective student journey](../journeys/prospective-student.md).

## App `/app` (authenticated)

See [Navigation spec](../spec/navigation-spec.md).

- Operations Dashboard
- **Leads** (`/app/leads`) — replaces Admissions; assign convert
- Students & Transfers
- Batches & Schedule
- Attendance
- Fees & Payments
- Inventory (kits Phase D)
- **Kit orders** (`/app/kits`) — when brand enables `kits` feature
- Settings — read-only center profile (brand-managed public blurb)
- Assessments / Reports — Phase D
