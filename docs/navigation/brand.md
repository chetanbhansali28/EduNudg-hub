# Brand Navigation (`http://{brand}.localhost:9000`)

## Public `/` (marketing landing)

**Franchise application** + **student application** forms (no subscription gate on public). Staff: `/login`. App: `/app/*`.

Details: [Portal host matrix](../spec/portal-host-matrix.md), [Marketing landing pages](../frontend/marketing-landing.md).

## App `/app` (authenticated)

See [Navigation spec](../spec/navigation-spec.md).

- Home (dashboard — unassigned / stale lead KPIs)
- **Student Leads** (`/app/leads`) — franchise-applications pipeline chrome: KPI stats (Pending review, Converted, Lost, Total), search, **Pending review** / **Decided** tabs, persistent list + stacked detail (assignment below applicant); assign; manual add; CSV export
- **Franchise Applications** (`/app/franchise-applications`) — **Pending review** / **Decided** tabs; KPI stats (Pending review, Approved, Rejected, Total); approve/reject; **Add Franchise** modal; soft-deleted centers stay on **Decided** with a DELETED badge
- Franchise Centers (`/app/centers`) — edit existing (including Franchise Identity login email/password); **no Social Media editor**; **View Frontend** / **View Backend**; disable/enable; soft-delete; new centers via franchise application approval or primary **Import Franchise** CSV
- Curriculum (`/app/curriculum`) — franchise-applications chrome: `PipelinePageHeader`, KPI stats (Active, Drafts, Programs, Total), search + filter tabs; courses, levels, units; add via **+ Add Curriculum** in the page header (no **+** on the Courses list); on/off toggle and **Save** right-aligned in course detail
- **Campaigns** (`/app/campaigns`) — CRUD
- **Success stories** (`/app/success-stories`) — franchise-applications pipeline chrome: KPI stats (Published, Draft, With photo, Total), search, **Published** / **Draft** tabs, persistent list + detail; **Add Story** modal
- **Merchandise** (`/app/merchandise`) — franchise-applications chrome: `PipelinePageHeader`, KPI stats (Active, Draft, Orders, Total), search + Catalog / Promo Codes / Orders / Payment settings tabs; catalog list + detail on desktop
- Analytics (`/app/analytics`)
- **Marketing pages** (`/app/homepage`) — brand franchise recruitment site (hero, FAQ, footer; success stories feed brand testimonials)
- **Center Site Configuration** (`/app/center-site`) — parent enrollment template for every franchise hostname
- **Billing** (`/app/billing`)
- Settings (logo, theme, `lead_stale_days`, timezone default IST)
