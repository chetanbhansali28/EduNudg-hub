# student-leads Specification

## Purpose

Parents enter the pipeline via brand student applications or direct center registration. Brand staff assign leads to centers; center staff progress, convert, or mark leads lost. WhatsApp deduplication and SLA stale rules apply per brand.

## Related

- Journey: [`docs/journeys/prospective-student.md`](../../../docs/journeys/prospective-student.md)
- Data flow: [`docs/spec/data-flow.md`](../../../docs/spec/data-flow.md) Flows 3–6
- Manual entry: [`docs/spec/manual-leads.md`](../../../docs/spec/manual-leads.md)
- Convert mapping: FR-C13 in [`docs/spec/functional-requirements.md`](../../../docs/spec/functional-requirements.md)

## Requirements

### Requirement: Brand public student application

The brand host SHALL expose a student application form with required fields: parent name, WhatsApp, email, child name, child DOB, city, and India 6-digit pincode; school name optional.

Traceability: FR-B02, FR-B03, FR-B04

#### Scenario: Parent applies on brand site

- **WHEN** a parent submits the student application on the brand public homepage
- **THEN** the system creates or merges a lead via `submit_brand_student_application`
- **AND** sets `lead_source = brand` with `center_id` null

### Requirement: Center public student registration

The center host SHALL expose student registration only — no franchise application form.

Traceability: FR-C01, FR-C02, FR-C03, FR-C04

#### Scenario: Parent registers on center site

- **WHEN** a parent submits registration on `{center}.{brand}` public homepage (`#register`)
- **THEN** the system upserts a lead via `submit_center_student_registration`
- **AND** sets `lead_source = center` with `center_id` set to the hosting center
- **AND** the public nav shows the brand logo only

### Requirement: Brand student leads pipeline

Brand staff SHALL manage student leads at `/app/leads` with filters for unassigned, assigned, stale (needs attention), and lost leads.

Traceability: FR-B10

#### Scenario: Unassigned brand lead visible

- **WHEN** brand staff open Student Leads with filter Unassigned
- **THEN** brand-application leads without `center_id` appear in the list

### Requirement: Pincode-based center suggestions

Brand staff SHALL receive pincode-ranked center suggestions and MUST manually confirm assignment.

Traceability: FR-B11, FR-B12

#### Scenario: Exact pincode match suggested

- **WHEN** brand staff view suggestions for a lead with a pincode
- **THEN** centers with exact pincode match are offered first
- **AND** nearby centers in the same city are ranked by last-3-digit pincode distance

#### Scenario: Manual assign override

- **WHEN** brand staff assign a lead
- **THEN** they may select any center in the brand, not only suggested centers

### Requirement: Lead stale SLA and reallocation

Brand-configured `lead_stale_days` (default 15) in brand timezone (default Asia/Kolkata) SHALL mark assigned leads stale when the center makes no qualifying status change in time.

Traceability: FR-B13, FR-B16, FR-B17

#### Scenario: Stale lead after inactivity

- **WHEN** a lead is assigned to a center and no qualifying status change occurs within `lead_stale_days`
- **THEN** the lead appears in brand Stale / Needs attention filter

#### Scenario: Brand reassigns stale lead

- **WHEN** brand staff reassign a stale lead to another center
- **THEN** assign timestamps reset and the new center sees the lead

### Requirement: Lost leads and reopen

Centers SHALL mark leads lost with a required reason; brands SHALL view lost leads read-only and MAY reopen them.

Traceability: FR-B14, FR-B15, FR-C11b

#### Scenario: Center marks lead lost

- **WHEN** center staff call `mark_lead_lost` with a reason
- **THEN** the lead status becomes `lost` with `lost_reason` stored
- **AND** brand staff see the lead in Lost filter with the reason
- **AND** brand staff cannot call `mark_lead_lost`

#### Scenario: Brand reopens lost lead

- **WHEN** brand staff call `reopen_lead` on a lost lead
- **THEN** the lead returns to the active pipeline
- **AND** prior `lost_reason` is preserved in `lead_events`

Traceability: FR-B15b

#### Scenario: WhatsApp re-application while lost

- **WHEN** a parent re-applies with the same WhatsApp while the lead is lost
- **THEN** fields merge into the existing lead
- **AND** status remains `lost` until brand explicitly reopens

### Requirement: Center leads workspace

Center staff SHALL see assigned brand leads and direct center leads at `/app/leads`.

Traceability: FR-C10

#### Scenario: Center sees only scoped leads

- **WHEN** center staff open Leads
- **THEN** they see leads assigned to their center and center-originated leads only
- **AND** they do not see unassigned brand leads or other centers' leads

### Requirement: Center lead status updates

Center staff SHALL update lead status (new, contacted, qualified); status changes reset the brand SLA clock.

Traceability: FR-C11

#### Scenario: Status change resets SLA

- **WHEN** center staff call `update_lead_status`
- **THEN** `last_center_action_at` is set to now
- **AND** the lead is no longer stale if within SLA rules

### Requirement: Convert lead to student

Center staff SHALL convert eligible leads to students via staff-only action; no parent self-serve link in v1.

Traceability: FR-C12, FR-C13, FR-C14

#### Scenario: Successful convert

- **WHEN** center staff convert a lead assigned to their center
- **THEN** the system creates or links parent, student, and enrollment in one RPC
- **AND** maps lead fields per FR-C13 (parent name, WhatsApp, child name/DOB, school, pincode, city, `source_lead_id`)
- **AND** sets `leads.status` to `converted`

#### Scenario: Cannot convert unassigned lead

- **WHEN** center staff attempt to convert a brand lead not assigned to their `center_id`
- **THEN** the system rejects the conversion

### Requirement: WhatsApp deduplication per brand

The system SHALL normalize WhatsApp to E.164 and merge duplicate submissions per brand.

Traceability: FR-X02

#### Scenario: Duplicate WhatsApp merges

- **WHEN** a second student application uses the same WhatsApp for the same brand
- **THEN** the system merges into the existing lead and logs `lead_events`
- **AND** does not create duplicate enrollments if already converted

### Requirement: Manual student lead entry

Staff SHALL create leads without public forms via manual entry cards and staff RPCs.

#### Scenario: Brand manual unassigned lead

- **WHEN** brand staff create a lead via `create_brand_student_lead_staff`
- **THEN** an unassigned lead with `lead_source = brand` appears in Student Leads

#### Scenario: Center manual lead

- **WHEN** center staff create a lead via `create_center_student_lead_staff`
- **THEN** a lead with `lead_source = center` and `center_id` set appears in center Leads
