# Manual lead entry (staff)

Staff can create pipeline records without public forms. All mutations use **SECURITY DEFINER** RPCs with tenant checks.

| Portal | Who | RPC | Creates |
|--------|-----|-----|---------|
| Platform `/admin` | Platform admin | `create_platform_brand_signup_staff` | `platform_brand_signups` (pending) |
| Brand `/app` | Brand staff | `create_franchise_inquiry_staff` | `franchise_inquiries` |
| Brand `/app` | Brand staff | `create_brand_student_lead_staff` | `leads` (`lead_source = brand`, unassigned) |
| Center `/app` | Center staff | `create_center_student_lead_staff` | `leads` (`lead_source = center`, `center_id` set) |
| Center `/app` | Center staff | `import_center_student_leads` | `leads` (CSV bulk; merges by WhatsApp) |
| Center `/app` | Center staff | `bulk_convert_center_leads` | converts open leads → students |
| Center `/app` | Center staff | `import_center_students` | enrolled `students` + profiles (CSV; skips leads) |

## WhatsApp merge

Student lead RPCs call `upsert_lead_by_whatsapp` — duplicate WhatsApp per brand **merges** and logs `manual_created` on `lead_events`.

## UI

- Platform: **`/admin/brands`** — manual signup card above the pending queue
- Brand: **Student Leads** — **+ New Lead** opens a modal (`ManualStudentLeadCard`); **Franchise Applications** — **Add Franchise** opens a modal (`ManualFranchiseInquiryCard`)
- Center: **Leads** — **+ Add Lead** opens the same modal (CSV-template fields plus notes); **Import CSV** for bulk walk-in/phone enquiries; **Convert all eligible** for open leads with parent + child names
- Center: **Students** — **Import students** for bulk enroll of existing students (template + `import_center_students`); **+ Add students** still goes to Leads

API wrappers: [`manualLeadsApi.ts`](../../apps/web/src/lib/manualLeadsApi.ts), [`centerStudentLeadImportApi.ts`](../../apps/web/src/lib/centerStudentLeadImportApi.ts), [`centerStudentImportApi.ts`](../../apps/web/src/lib/centerStudentImportApi.ts)
