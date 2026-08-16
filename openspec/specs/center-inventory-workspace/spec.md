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
- **AND** the item photo is left-aligned in a 50% top-row column beside stock facts
- **AND** column 2 uses `PipelineDetailPanel` with a primary `@edunudg/ui` **Place New Order** button (not a custom blue link)

#### Scenario: Detail photo is left and half width

- **GIVEN** a center user selects an inventory item with a product photo
- **WHEN** they view the second-column detail
- **THEN** the photo sits in the left 50% of the top row (`ed-inv-detail__top`)
- **AND** Available, On hand, Incoming, and Allocated sit beside the photo

#### Scenario: Incoming and orders share a row

- **GIVEN** a center user selects an inventory item
- **WHEN** they view the second-column detail on desktop
- **THEN** **On the way** and **Orders (last 6 months)** render side by side (`ed-inv-detail__split`)

#### Scenario: Detail column follows pipeline theme

- **GIVEN** a center user selects an inventory item
- **THEN** the detail column is a `PipelineDetailPanel` (title, stock badge, stock facts, incoming, orders, inventory value)
- **AND** **Place New Order** is a primary `Button` that opens `/app/merchandise`
- **AND** inventory value uses theme tokens (`--ed-border`, `--ed-fg`, `--ed-success`) rather than a purple marketing card
- **AND** the detail head and body have extra top padding so the column is not flush to the top edge
