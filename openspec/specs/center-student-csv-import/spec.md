# center-student-csv-import Specification

## Purpose

Center staff bulk-enroll existing students from CSV on `/app/students`. Each valid row creates the student, parent, profile, and active enrollment — without going through the leads pipeline.

## Related

- Students workspace: [`center-students-workspace`](../center-students-workspace/spec.md)
- Lead CSV (enquiries, not enrollments): [`center-student-lead-csv-import`](../center-student-lead-csv-import/spec.md)
- Convert mapping: FR-C13 in [`docs/spec/functional-requirements.md`](../../../docs/spec/functional-requirements.md)
- Franchise CSV pattern: [`franchise-center-csv-import`](../franchise-center-csv-import/spec.md)
- Ops: [`docs/ops/center-student-csv-import.md`](../../../docs/ops/center-student-csv-import.md)

## Requirements

### Requirement: Import control on Students

Center staff SHALL import enrolled students from `/app/students` using a header action next to **+ Add students**.

#### Scenario: Header button

- **GIVEN** a center user on `/app/students`
- **THEN** **Import students** appears in the page header next to **+ Add students**
- **AND** clicking it opens the **Import students** dialog

#### Scenario: Add students unchanged

- **GIVEN** a center user on `/app/students`
- **THEN** **+ Add students** still opens `/app/leads` for the enquiry → convert path

### Requirement: CSV template download

Center staff SHALL download a student import template from the import dialog.

#### Scenario: Download template

- **GIVEN** the **Import students** dialog is open
- **WHEN** they click **Download template**
- **THEN** the browser downloads a CSV with headers `student_name`, `parent_name`, `whatsapp`, plus optional profile and program columns, and one sample row
- **AND** the template does not include `student_code` or `phone`

### Requirement: Client-side CSV validation

The SPA SHALL parse CSV files locally, enforce limits, and preview rows before import.

#### Scenario: Reject invalid file type

- **WHEN** the user selects a non-`.csv` file or a file larger than 2 MB
- **THEN** the UI shows an error and does not call the server

#### Scenario: Preview valid and invalid rows

- **WHEN** the user selects a valid CSV with required columns
- **THEN** the UI shows a preview table with per-row validation errors
- **AND** only rows without client validation errors are eligible for import

#### Scenario: Required columns

- **WHEN** the CSV is missing `student_name`, `parent_name`, or `whatsapp`
- **THEN** the UI shows an error and does not call the server

#### Scenario: Sanitize formula injection

- **WHEN** a cell begins with `=`, `+`, `-`, `@`, or tab
- **THEN** the client neutralizes the leading character before validation and RPC submission

### Requirement: Secure bulk student import RPC

The system SHALL create enrolled students via `import_center_students(p_center_id, p_rows)` using parameterized JSON rows only.

#### Scenario: Authorized center staff import

- **GIVEN** caller has `has_center_access(p_center_id)` (or `is_platform_admin()`)
- **WHEN** valid rows are submitted
- **THEN** each row creates `students`, `parents` (reused by WhatsApp when already at the brand), `parent_student_links`, `student_profiles`, and an active `student_enrollments` row for that center
- **AND** `students.source_lead_id` stays null
- **AND** the RPC assigns the next brand `student_code` (`STU-001`, `STU-002`, …)
- **AND** `student_profiles.phone` is set from the normalized WhatsApp number
- **AND** portal invite is not sent (`login_email` is stored when provided)

#### Scenario: Ignore CSV student_code and phone

- **WHEN** a leftover CSV includes `student_code` or a separate `phone` column
- **THEN** `student_code` is ignored
- **AND** `phone` is treated as WhatsApp when `whatsapp` is empty

#### Scenario: Optional program pin

- **WHEN** `program_name` matches a course assigned to the center
- **THEN** the RPC pins that program (and `starting_level` when it matches a level name)
- **AND** unknown or unassigned program names fail that row without creating the student

#### Scenario: Reject unauthorized caller

- **WHEN** caller lacks center access
- **THEN** the RPC raises `Not authorized`

#### Scenario: Partial success and duplicates

- **WHEN** some rows fail validation
- **THEN** valid rows still import
- **AND** the RPC returns per-row `created`, `skipped`, and `errors` arrays
- **AND** an already-enrolled student at this center (same `login_email`, or student name + parent WhatsApp) is skipped, not duplicated
