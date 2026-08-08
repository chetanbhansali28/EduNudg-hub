# center-student-lead-csv-import Specification

## Purpose

Center staff bulk-add prospective students to the leads pipeline from CSV on `/app/leads`, then convert eligible leads to enrolled students individually or in bulk.

## Related

- Student leads pipeline: `openspec/specs/student-leads/spec.md`
- Manual entry: `docs/spec/manual-leads.md`
- Franchise center CSV import pattern: `openspec/specs/franchise-center-csv-import/spec.md`

## Requirements

### Requirement: CSV template download

Center staff SHALL download a student lead import template from `/app/leads`.

#### Scenario: Download template

- **GIVEN** center staff are on `/app/leads`
- **WHEN** they open **Import CSV** and click **Download template**
- **THEN** the browser downloads a CSV with headers `parent_name`, `whatsapp`, `email`, and optional profile columns plus one sample row

### Requirement: Client-side CSV validation

The SPA SHALL parse CSV files locally, enforce limits, and preview rows before import.

#### Scenario: Reject invalid file type

- **WHEN** the user selects a non-`.csv` file or a file larger than 2 MB
- **THEN** the UI shows an error and does not call the server

#### Scenario: Preview valid and invalid rows

- **WHEN** the user selects a valid CSV with required columns
- **THEN** the UI shows a preview table with per-row validation errors
- **AND** only rows without client validation errors are eligible for import

#### Scenario: Sanitize formula injection

- **WHEN** a cell begins with `=`, `+`, `-`, `@`, or tab
- **THEN** the client neutralizes the leading character before validation and RPC submission

### Requirement: Secure bulk lead import RPC

The system SHALL create center leads via `import_center_student_leads(p_center_id, p_rows)` using parameterized JSON rows only.

#### Scenario: Authorized center staff import

- **GIVEN** caller has `has_center_access(p_center_id)`
- **WHEN** valid rows are submitted
- **THEN** each row upserts a lead with `lead_source = center` and `center_id` set
- **AND** logs `csv_imported` or `csv_imported_merge` on `lead_events`
- **AND** duplicate WhatsApp per brand merges via `upsert_lead_by_whatsapp`

#### Scenario: Reject unauthorized caller

- **WHEN** caller lacks center access
- **THEN** the RPC raises `Not authorized`

#### Scenario: Partial success

- **WHEN** some rows fail validation or hit converted-lead WhatsApp conflicts
- **THEN** valid rows still import
- **AND** the RPC returns per-row `created`, `merged`, and `errors` arrays

### Requirement: Bulk convert open leads

Center staff SHALL convert all eligible open leads for their center in one action.

#### Scenario: Convert all eligible

- **GIVEN** open leads at the center with parent and child names
- **WHEN** center staff confirm **Convert all eligible**
- **THEN** `bulk_convert_center_leads(p_center_id)` calls `convert_lead_to_student` for each eligible lead
- **AND** returns converted student ids and per-lead errors for skipped rows

#### Scenario: Skip ineligible leads

- **WHEN** an open lead is missing `child_name` or parent name
- **THEN** bulk convert skips it with an error entry
- **AND** other eligible leads still convert

#### Scenario: Single convert unchanged

- **WHEN** center staff convert one lead from the detail panel
- **THEN** existing `convert_lead_to_student` behavior is unchanged
