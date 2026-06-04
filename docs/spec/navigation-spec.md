# Navigation spec — left sidebar (`/admin`, `/app`)

Target state for v1 implementation. Source of truth for menu labels; routes must exist in `AppRoutes.tsx` when marked **new**.

**Confirmed (product):**

- Brand: separate **Student Leads** and **Franchise Applications**
- Platform: self-serve approvals under **Brands → Signup requests** tab (no new top-level item)
- Student (`learn.*`): **Dashboard** + **Profile** only in v1

---

## Platform — `/admin` (EduNudg ops)

| Section | Item | Route | Status |
|---------|------|-------|--------|
| Main menu | Home | `/admin` | Exists |
| Features | Brands | `/admin/brands` | Exists |
| | ↳ Signup requests | `/admin/brands` tab **signups** | Exists — includes manual add |
| | Subscriptions | `/admin/subscriptions` | Exists |
| | Revenue & Usage | `/admin/revenue` | Exists |
| | Audit Logs | `/admin/audit` | Exists |
| General | Settings | `/admin/settings` | Exists |
| | Homepage (EduNudg marketing) | `/admin/homepage` | Exists |
| Footer | Log out | — | Exists |

**Not in platform nav:** student leads, franchise applications, center operations (brand-scoped).

---

## Brand — `/app` (brand owner / admin)

| Section | Item | Route | Status |
|---------|------|-------|--------|
| Main menu | Home | `/app` | Exists — stale/unassigned lead KPIs |
| Features | **Student Leads** | `/app/leads` | Exists — manual add, assign, stale, lost |
| | **Franchise Applications** | `/app/franchise-applications` | Exists — approve/reject, manual add |
| | Franchise Centers | `/app/centers` | Exists |
| | Curriculum | `/app/curriculum` | Exists — abacus level metadata, PageGrid |
| | Royalties | `/app/royalties` | Exists |
| | Analytics | `/app/analytics` | Exists |
| | Campaigns | `/app/campaigns` | Exists — CRUD |
| | **Success stories** | `/app/success-stories` | Exists — CRUD |
| | Kit catalog | `/app/kits` | Exists — CRUD |
| General | Settings | `/app/settings` | Exists |
| | **Billing** | `/app/billing` | Exists — subscription checkout stub |
| Footer | Log out | — | Exists |

**Removed from Settings-only:** franchise inquiry list (moves to Franchise Applications).

---

## Center (franchise) — `/app`

| Section | Item | Route | Status |
|---------|------|-------|--------|
| Main menu | Home | `/app` | Exists — open leads KPI |
| Features | **Leads** | `/app/leads` | Exists — manual add, convert, mark lost |
| | Students | `/app/students` | Exists |
| | Batches | `/app/batches` | Exists |
| | Attendance | `/app/attendance` | Exists |
| | Fees & Payments | `/app/fees` | Exists |
| | Inventory / Kits | `/app/inventory` | Exists → kit orders Phase D |
| | Assessments | `/app/assessments` | Phase D |
| | Reports | `/app/reports` | Phase D |
| General | Settings | `/app/settings` | Exists |
| Footer | Log out | — | Exists |

**Center `/app/leads`:** assigned leads + direct `lead_source = center`; status changes reset SLA; **Convert** action.

---

## Student — `learn.*` host (v1 minimal)

| Section | Item | Route | Status |
|---------|------|-------|--------|
| Main | Dashboard | `/` | Exists |
| General | Profile | `/profile` | Exists |
| — | Progress, Competitions, Kits | — | **Not in v1 nav** |

No sidebar required on mobile — single column shell acceptable.

---

## Parents — `parents.*` host

Out of v1 scope. Spec placeholder: mirror student minimal nav when built.

---

## Public marketing nav (top bar, not sidebar)

| Host | CTA anchors |
|------|-------------|
| Platform | Sign in → `/login`; brand signup section on `/` |
| Brand | `#apply` franchise, `#enroll-student` student application |
| Center | `#register` student registration |

---

## Implementation notes

- Update [`apps/web/src/lib/portalNav.tsx`](../../apps/web/src/lib/portalNav.tsx) when routes are added.
- Home active state: exact match for `/admin` and `/app` (regression tests required).
- App pages use `PageGrid`, `PageGridFull`, `FormGrid` from `@edunudg/ui` — see [ui-shell-standards.md](./ui-shell-standards.md).
- Manual lead entry: [manual-leads.md](./manual-leads.md).
