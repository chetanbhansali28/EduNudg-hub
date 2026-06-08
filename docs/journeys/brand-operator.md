# Journey: Brand operator

Brand staff use `http://{brand}.localhost:9000/app/*`.

## Primary menus (v1)

| Menu | Purpose |
|------|---------|
| Home | Compact KPI grid: unassigned leads, stale leads, new franchise applications |
| **Student Leads** | Assign, reallocate, view lost with reasons |
| **Franchise Applications** | Approve/reject; provisions center + domain |
| Franchise Centers | List/edit centers; pincode required for suggestions |
| Curriculum | Programs, levels (existing) |
| Royalties | Brand ↔ franchise money (not EduNudg subscription) |
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
- Read-only visibility into any student/center under brand for growth planning (Phase B/C pages).

## Billing

- Brand pays **EduNudg** subscription (platform admin / invoices).
- Royalties and kits are **brand ↔ franchise**, not platform.

## Related

- [Navigation spec](../spec/navigation-spec.md)
- [Data flow](../spec/data-flow.md)
