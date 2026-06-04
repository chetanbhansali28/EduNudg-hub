# Brand Navigation (`http://{brand}.localhost:9000`)

## Public `/` (marketing landing)

**Franchise application** + **student application** forms (no subscription gate on public). Staff: `/login`. App: `/app/*`.

Details: [Portal host matrix](../spec/portal-host-matrix.md), [Marketing landing pages](../frontend/marketing-landing.md).

## App `/app` (authenticated)

See [Navigation spec](../spec/navigation-spec.md).

- Home (dashboard — unassigned / stale lead KPIs)
- **Student Leads** (`/app/leads`) — assign, stale queue, manual add
- **Franchise Applications** (`/app/franchise-applications`) — approve/reject, manual add
- Franchise Centers (`/app/centers`) — edit existing; new centers via franchise application approval only
- Curriculum (abacus level metadata, topics, marketing video)
- Royalties & Finance
- Analytics
- **Campaigns** (`/app/campaigns`) — CRUD
- **Success stories** (`/app/success-stories`) — CRUD
- **Marketing pages** (`/app/homepage`) — brand franchise site + center enrollment template (hero, FAQ, footer; success stories feed brand testimonials)
- **Billing** (`/app/billing`)
- Settings (logo, theme, `lead_stale_days`, timezone default IST)
