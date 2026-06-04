# Functional requirements

FR IDs for v1 franchise/student journey. Portal column: `P` platform, `B` brand, `C` center, `S` student learn.

---

## Platform (EduNudg)

| ID | Portal | Requirement | Acceptance |
|----|--------|-------------|------------|
| FR-P01 | P | Public marketing + **brand signup** form on `/` | Fields: org name, admin name, email, phone, **city** (required), country, message |
| FR-P02 | P | `submit_platform_brand_signup` persists pending signup | One pending row per admin email |
| FR-P03 | P | Admin approves under **Brands → Signup requests** | Approve creates brand, slug `{name}-{city}`, domain, draft subscription |
| FR-P04 | P | Approve creates **brand_owner** membership + auth invite | Signup email can log in on brand host `/app` |
| FR-P05 | P | Slug collision | Append `-2`, `-3` after city-suffixed base |
| FR-P06 | P | No franchise/student forms on platform host | QA on localhost:9000 |

---

## Brand public

| ID | Portal | Requirement | Acceptance |
|----|--------|-------------|------------|
| FR-B01 | B | Franchise application form | Extended fields: name, email, phone, franchise name, address, city, state, pincode, experience |
| FR-B02 | B | Student application form | **Required:** parent name, WhatsApp, email, child name, child DOB, **city**, **pincode** (India 6-digit), school optional |
| FR-B03 | B | Public forms without paid subscription gate | Live when brand active + domain mapped |
| FR-B04 | B | `submit_brand_student_application` sets `lead_source = brand` | `center_id` null |

---

## Brand app — Student leads

| ID | Portal | Requirement | Acceptance |
|----|--------|-------------|------------|
| FR-B10 | B | **Student Leads** nav item `/app/leads` | Lists: unassigned, assigned, stale, **lost** |
| FR-B11 | B | Pincode suggestions | Exact → same city + 3-digit prefix → rank by last-3 distance; **manual assign only** |
| FR-B12 | B | Assign to any center in brand | Override dropdown beyond suggestions |
| FR-B13 | B | Reallocate stale leads | After configurable SLA days without center status change |
| FR-B14 | B | **Lost leads** visible with **reason** | Read-only list; shows `lost_reason` set by center |
| FR-B15 | B | **Reopen** lost lead | **Brand only** — `reopen_lead` RPC; prior `lost_reason` kept in `lead_events` |
| FR-B15b | B | WhatsApp re-application after lost | Merge/reopen rules: if lead `lost`, brand may reopen explicitly; auto-reopen on merge optional — default require brand **Reopen** action |
| FR-B18 | B | **Billing** — pay platform subscription | `/app/billing` via payment gateway service; updates `platform_invoices` / subscription period |
| FR-B16 | B | Configurable SLA days | `brand_settings.lead_stale_days` default **15** |
| FR-B17 | B | SLA uses brand timezone | Default `Asia/Kolkata`; stale computed in that zone |

---

## Brand app — Franchise applications

| ID | Portal | Requirement | Acceptance |
|----|--------|-------------|------------|
| FR-B20 | B | **Franchise Applications** nav `/app/franchise-applications` | Moved out of Settings |
| FR-B21 | B | Approve creates center + domain + operator invite | Same transaction: `franchise_centers`, `{center}.{brand}` mapping |
| FR-B22 | B | 360° read-only student/center views | All centers under brand (Phase B/C) |

---

## Center public

| ID | Portal | Requirement | Acceptance |
|----|--------|-------------|------------|
| FR-C01 | C | Student **registration** form only | No franchise form |
| FR-C02 | C | Nav shows **brand** logo only | No center logo |
| FR-C03 | C | Center blurb on page | display_name, area, contact from `franchise_centers` / profile |
| FR-C04 | C | `submit_center_student_registration` | `lead_source = center`, `center_id` set |

---

## Center app

| ID | Portal | Requirement | Acceptance |
|----|--------|-------------|------------|
| FR-C10 | C | **Leads** `/app/leads` | Assigned + direct center leads |
| FR-C11 | C | Status change only resets SLA | `update_lead_status` sets `last_center_action_at` |
| FR-C11b | C | **Mark lead lost** — center only | `mark_lead_lost(p_lead_id, p_reason)` — requires `lost_reason`; brand cannot call |
| FR-C12 | C | Staff-only **Convert** | No parent self-serve link v1 |
| FR-C13 | C | Convert field mapping | See [Convert mapping](#fr-c13--convert_lead_to_student-field-mapping) |
| FR-C14 | C | Cannot convert unassigned brand leads | `center_id` must match self |

---

## FR-C13 — `convert_lead_to_student` field mapping

| Lead column | Target | Notes |
|-------------|--------|-------|
| `parent_name` | `parents.full_name` (create/link) | Primary parent |
| `whatsapp_e164` | `parents.phone_e164` | Normalized E.164 |
| `email` | `parents.email` | If column exists or profile |
| `child_name` | `students.full_name` | |
| `child_dob` | `students.date_of_birth` | |
| `school_name` | `student_profiles.school_name` or `students` JSONB | Phase A: JSONB on student ok |
| `pincode` | `student_profiles.pincode` or lead copy on enrollment notes | |
| `city` | `student_profiles.city` | From lead |
| `id` | `students.source_lead_id` | Lineage |
| — | `student_enrollments` | Created in same RPC transaction; status per product default |
| — | `leads.status` | Set to `converted` |

UI: Convert dialog shows read-only prefill; staff may add `student_code`, batch, curriculum version before submit.

---

## Cross-cutting

| ID | Portal | Requirement | Acceptance |
|----|--------|-------------|------------|
| FR-X01 | All | Default timezone **Asia/Kolkata** | Platform + brand settings; display timestamps in brand TZ |
| FR-X02 | All | WhatsApp dedup per brand | `normalize_phone_e164`; merge on duplicate |
| FR-X03 | All | RLS tenant isolation | No cross-brand / cross-center reads |
| FR-X04 | All | Public writes via RPC | No direct anon INSERT on leads |
| FR-X05 | All | Mobile-first responsive UI | Marketing + app shell breakpoints |
| FR-X06 | B,C | App layout 3/2/1 column desktop/tablet/mobile | See ui-shell-standards |
| FR-X07 | All | **Modular features** | One feature folder per capability; see services-layer |
| FR-X08 | All | **Feature flags** | Modules + integrations ON/OFF per spec |
| FR-X09 | B | **Base theme** | Screens use `@edunudg/ui` tokens/components |

---

## Student learn portal (v1 minimal)

| ID | Portal | Requirement | Acceptance |
|----|--------|-------------|------------|
| FR-S01 | S | Nav: Dashboard + Profile only | No kits in UI |
| FR-S02 | S | Auth Google + WhatsApp OTP | Phase D |
| FR-S03 | S | Kits not visible | RLS + no routes |

---

## Phase E (out of v1)

- FR-B30 Campaigns
- FR-C20 Kit orders / allocations
- Full assessments, reports routes

---

## Related

- [RPC catalog](./rpc-catalog.md)
- [Data flow](./data-flow.md)
- [Navigation spec](./navigation-spec.md)
