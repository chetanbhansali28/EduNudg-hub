# Center student CSV import

Center staff bulk-enroll existing students from a CSV template on **Students** (`/app/students`). This is for students already at the franchise — not walk-in enquiries (those stay on **Leads** → **Import CSV**).

## Spec

Canonical behavior: [`openspec/specs/center-student-csv-import/spec.md`](../../openspec/specs/center-student-csv-import/spec.md).

## Flow

1. Open **Students** → **Import students**.
2. Download the CSV template (required: `student_name`, `parent_name`, `whatsapp`). Optional: `email`, `student_dob`, `login_email`, `school_name`, `address_line1`, `city`, `state`, `pincode`, `program_name`, `starting_level`. Do **not** send `student_code` or `phone` — the RPC assigns `STU-NNN` and copies WhatsApp onto the profile phone.
3. Fill rows locally; SPA validates file type (`.csv`), size (≤ 2 MB), and rejects binary content.
4. Preview valid vs invalid rows in the import dialog.
5. Confirm → RPC `import_center_students(p_center_id, p_rows)` creates student + parent + profile + active enrollment.
6. Optional `program_name` must match a course assigned to that franchise; otherwise that row fails.

Center **Leads** → **Add student lead** uses the same field set as this template (plus notes). After import or convert, **Portal access** Login email shows `login_email` when set, otherwise the parent `email`. Franchise staff can **Copy Profile URL** there to share the student/parent learn-portal login (no password).

## Security notes

- Prefer parameterized JSON rows via the RPC — do not build dynamic SQL from CSV cells.
- Client validation is UX only; the RPC enforces `has_center_access(p_center_id)` (or `is_platform_admin()`) and tenant scope.
- Does **not** create leads or send student portal invites. Staff invite from student detail after import if needed.
- Re-import of the same student at this center is skipped (login email, or name + parent WhatsApp).
- UI: `CenterStudentImportDialog` + helpers in `apps/web/src/lib/centerStudentImport*`.

## Tests

- Vitest: `CenterStudentImportDialog.test.tsx`, `centerStudentImportHelpers.test.ts`, `StudentsPage.test.tsx`
- RLS: `supabase/tests/rls_import_center_students.sql`

## Related

- [Lead CSV import](../../openspec/specs/center-student-lead-csv-import/spec.md) (enquiries on `/app/leads`)
- [Center students workspace](../../openspec/specs/center-students-workspace/spec.md)
- [Franchise owner journey](../journeys/franchise-owner.md)
