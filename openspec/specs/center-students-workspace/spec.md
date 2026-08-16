# center-students-workspace Specification

## Purpose

Center staff manage enrolled students at `/app/students` with the same pipeline chrome as center Curriculum (`PipelinePageHeader`, KPI stats, search, filter tabs, list + detail).

## Related

- Convert mapping: FR-C13 in [`docs/spec/functional-requirements.md`](../../../docs/spec/functional-requirements.md)
- Navigation: [`docs/spec/navigation-spec.md`](../../../docs/spec/navigation-spec.md)
- Shell: [`docs/spec/ui-shell-standards.md`](../../../docs/spec/ui-shell-standards.md)
- Leads convert: [`student-leads`](../student-leads/spec.md)
- Reference chrome: [`brand-curriculum-workspace`](../brand-curriculum-workspace/spec.md)

## Requirements

### Requirement: Pipeline chrome on center Students

Center staff SHALL manage enrollments at `/app/students` with the same workspace chrome as Curriculum: page header, KPI stats strip, search, filter tabs, and a list with detail beside it on desktop.

#### Scenario: Page chrome matches curriculum

- **GIVEN** a center user on `/app/students`
- **THEN** the page uses `PipelinePageHeader` + `LeadKpiGrid` like Curriculum
- **AND** stats cards show Linked, Unassigned, Programs, and Total
- **AND** Programs is informational (not a filter shortcut)
- **AND** **+ Add students** in the page header opens `/app/leads`

#### Scenario: Filter tabs and search

- **GIVEN** a center user on `/app/students`
- **THEN** filter tabs are All students (All on mobile), Linked, and Unassigned
- **AND** search matches student name or ID
- **AND** desktop keeps `PipelineWorkspace` list visible beside student detail
