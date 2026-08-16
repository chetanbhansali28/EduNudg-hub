# center-fees-workspace Specification

## Purpose

Center staff create invoices and record payments at `/app/fees` with the same pipeline chrome as center Curriculum (`PipelinePageHeader`, KPI stats, search, section tabs, list + detail).

## Related

- Navigation: [`docs/spec/navigation-spec.md`](../../../docs/spec/navigation-spec.md)
- Shell: [`docs/spec/ui-shell-standards.md`](../../../docs/spec/ui-shell-standards.md)
- Students workspace: [`center-students-workspace`](../center-students-workspace/spec.md)
- Reference chrome: [`brand-curriculum-workspace`](../brand-curriculum-workspace/spec.md)

## Requirements

### Requirement: Pipeline chrome on center Fees

Center staff SHALL manage invoices and payments at `/app/fees` with the same workspace chrome as Curriculum: page header, KPI stats strip, search, section tabs, and a list with detail beside it.

#### Scenario: Page chrome matches curriculum

- **GIVEN** a center user on `/app/fees`
- **THEN** the page uses `PipelinePageHeader` + `LeadKpiGrid` like Curriculum
- **AND** stats cards show Outstanding, Paid, Overdue, and Total
- **AND** Outstanding counts invoices with status `sent` or `partial` (not overdue)
- **AND** clicking a KPI opens the Invoices tab with that invoice filter

#### Scenario: Invoices and Payments tabs

- **GIVEN** a center user on `/app/fees`
- **THEN** section tabs are Invoices and Payments
- **AND** search filters the current tab
- **AND** the Invoices tab lists invoices and shows **Add invoice** in the detail column
- **AND** both tabs keep **Record payment** in the detail column
- **AND** the page uses `PipelineWorkspace`
