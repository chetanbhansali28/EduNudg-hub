# Brand Navigation (`http://{brand}.localhost:9000`)

## Public `/` (marketing landing)

**Franchise application** + **student application** forms (no subscription gate on public). Staff: `/login`. App: `/app/*`.

Details: [Portal host matrix](../spec/portal-host-matrix.md), [Marketing landing pages](../frontend/marketing-landing.md).

## App `/app` (authenticated)

See [Navigation spec](../spec/navigation-spec.md).

- Home (dashboard — unassigned / stale lead KPIs)
- **Student Leads** (`/app/leads`) — assign, stale queue, manual add
- **Franchise Applications** (`/app/franchise-applications`) — approve/reject; **Add Franchise** modal; **Deleted** tab last for applications whose center was later soft-deleted (those rows also sort last on **All applications**)
- Franchise Centers (`/app/centers`) — edit existing (including Franchise Identity login email/password); **View Frontend** / **View Backend**; disable/enable; soft-delete; new centers via franchise application approval or **Import Franchise** CSV
- Curriculum (`/app/curriculum`) — courses, levels, units, publish; course banner upload shows formats, 5 MB max, and 1280×720 recommendation
- Royalties & Finance
- Analytics
- **Campaigns** (`/app/campaigns`) — CRUD
- **Success stories** (`/app/success-stories`) — CRUD
- **Marketing pages** (`/app/homepage`) — brand franchise site + center enrollment template (hero, FAQ, footer; success stories feed brand testimonials)
- **Billing** (`/app/billing`)
- Settings (logo, theme, `lead_stale_days`, timezone default IST)
