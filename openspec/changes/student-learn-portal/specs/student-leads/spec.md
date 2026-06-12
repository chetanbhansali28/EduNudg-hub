## ADDED Requirements

### Requirement: Convert stores student portal login email

Center staff MAY provide a student portal login email during convert; the system SHALL persist it on the student record for later portal invite.

Traceability: FR-C13 extension, FR-S12

#### Scenario: Convert with student login email

- **WHEN** center staff convert a lead with override `student_login_email` set to a valid email
- **THEN** `convert_lead_to_student` creates the student and enrollment as today
- **AND** sets `students.login_email` to the provided email
- **AND** does not send auth invite automatically (center triggers invite separately)

#### Scenario: Convert without student login email

- **WHEN** center staff convert without `student_login_email`
- **THEN** convert succeeds as today
- **AND** `students.login_email` remains null until center sets it on Students page
