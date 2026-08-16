# center-inventory-workspace Specification

## Purpose

Center staff track on-hand merchandise stock at `/app/inventory` with the same pipeline chrome as center Curriculum (`PipelinePageHeader`, KPI stats, search, filter tabs, list + detail).

## Related

- Navigation: [`docs/spec/navigation-spec.md`](../../../docs/spec/navigation-spec.md)
- Shell: [`docs/spec/ui-shell-standards.md`](../../../docs/spec/ui-shell-standards.md)
- Merchandise shop: [`brand-merchandise`](../brand-merchandise/spec.md)
- Reference chrome: [`brand-curriculum-workspace`](../brand-curriculum-workspace/spec.md)

## Requirements

### Requirement: Pipeline chrome on center Inventory

Center staff SHALL manage inventory at `/app/inventory` with the same workspace chrome as Curriculum: page header, KPI stats strip, search, filter tabs, and a list with item detail beside it on desktop.

#### Scenario: Page chrome matches curriculum

- **GIVEN** a center user on `/app/inventory`
- **THEN** the page uses `PipelinePageHeader` + `LeadKpiGrid` like Curriculum
- **AND** stats cards show In stock, Low stock, Incoming, and Total
- **AND** Incoming is informational (not a filter shortcut)
- **AND** Low stock counts SKUs with available units at or below the low-stock threshold
- **AND** **Export CSV** remains in the page header

#### Scenario: Filter tabs and search

- **GIVEN** a center user on `/app/inventory`
- **THEN** filter tabs are All items (All on mobile), In stock, and Low stock
- **AND** search matches item name or SKU
- **AND** desktop keeps `PipelineWorkspace` list visible beside item detail (order history, incoming, inventory value)
