# Journey: Brand operator

Brand staff use `http://{brand}.localhost:9000/app/*`.

## Primary menus (v1)

| Menu | Purpose |
|------|---------|
| Home | Compact KPI grid: unassigned leads, stale leads, new franchise applications |
| **Student Leads** | Assign, reallocate, view lost with reasons |
| **Franchise Applications** | Approve/reject; Add Franchise modal; provisions center + domain |
| Franchise Centers | Master-detail `/app/centers` — profile (no Social Media), open frontend/backend, disable/enable, delete, curriculum, **Import Franchise** CSV |
| Curriculum | Master-detail `/app/curriculum` — pipeline header + Active/Drafts/Programs/Total KPIs; courses/levels/units; on/off toggle in course detail header; parent marketing stays editable after create |
| Merchandise | Catalog, promos, and franchise orders — pipeline header + Active/Draft/Orders/Total KPIs |
| Analytics | Cross-center metrics |
| Settings | Logo, theme, **`lead_stale_days`**, **timezone**, feature/integration toggles |
| **Billing** | Pay EduNudg platform subscription (payment gateway) |

## Student lead operations

1. **Unassigned** — brand applications awaiting center pick.
2. **Assign** — suggestions from pincode; confirm manually; may override to any center.
3. **Stale** — franchise inactive 15+ days (configurable); reallocate to another center.
4. **Lost** — view-only list with `lost_reason` (set by center). **Reopen** action for brand when business warrants.

## Franchise operations

- Approve inquiry → center host live + operator invite (same transaction).
- **Import Franchise** CSV on `/app/centers` — same template and `import_franchise_centers` RPC as platform admins ([ops](../ops/franchise-center-csv-import.md)).
- Open that franchise’s **Frontend** (public site) and **Backend** (`/app`) from the franchise detail panel (**View Frontend** / **View Backend**).
- **Disable / Enable** franchise (`suspended` ↔ `active`). **Delete** is a soft-delete (`deleted_at`). Approved Franchise Applications stay as history on **Decided** with a DELETED badge (sorted after live decided rows).
- Read-only visibility into any student/center under brand for growth planning (Phase B/C pages).

## Billing

- Brand pays **EduNudg** subscription (platform admin / invoices).
- Royalties and kits are **brand ↔ franchise**, not platform.

## Related

- [Navigation spec](../spec/navigation-spec.md)
- [Data flow](../spec/data-flow.md)
