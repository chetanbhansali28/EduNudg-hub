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

## WhatsApp merge

Student lead RPCs call `upsert_lead_by_whatsapp` — duplicate WhatsApp per brand **merges** and logs `manual_created` on `lead_events`.

## UI

- Platform: **`/admin/brands`** — manual signup card above the pending queue
- Brand: **Student Leads** / **Franchise Applications** — manual card at top
- Center: **Leads** — manual card at top; **Import CSV** for bulk walk-in/phone enquiries; **Convert all eligible** for open leads with parent + child names

API wrappers: [`manualLeadsApi.ts`](../../apps/web/src/lib/manualLeadsApi.ts), [`centerStudentLeadImportApi.ts`](../../apps/web/src/lib/centerStudentLeadImportApi.ts)
