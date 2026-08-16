# brand-merchandise Specification

## Purpose

Brand staff manage the merchandise catalog, promo codes, payment settings, and franchise orders at `/app/merchandise`, gated by the `merchandise` feature flag.

## Related

- Product: [`docs/spec/merchandise.md`](../../../docs/spec/merchandise.md)
- Journey: [`docs/journeys/brand-operator.md`](../../../docs/journeys/brand-operator.md)
- Navigation: [`docs/spec/navigation-spec.md`](../../../docs/spec/navigation-spec.md)
- Competitions stay off this page: [`brand-competitions-module`](../brand-competitions-module/spec.md)

## Requirements

### Requirement: Pipeline chrome on Merchandise

Brand staff SHALL manage merchandise at `/app/merchandise` with the same pipeline chrome as Franchise Applications: page header, KPI stats strip, search, section tabs, and a list with detail beside it on desktop for Catalog, Promo Codes, Orders, and Payment settings.

#### Scenario: Page chrome matches franchise applications

- **GIVEN** a brand user on `/app/merchandise`
- **THEN** the page uses `PipelinePageHeader` + `LeadKpiGrid` like Franchise Applications
- **AND** stats cards show Active, Draft, Orders, and Total
- **AND** **+ Add Merchandise** remains in the page header on the Catalog section
- **AND** **+ Add Promo Code** appears in the page header on the Promo Codes section
- **AND** section tabs remain Catalog, Promo Codes, Orders, and Payment settings

#### Scenario: KPI cards filter catalog or open orders

- **GIVEN** a brand user on `/app/merchandise`
- **WHEN** they click Active, Draft, or Total
- **THEN** the Catalog section is shown with that catalog filter
- **WHEN** they click Orders
- **THEN** the Orders section is shown

#### Scenario: Desktop catalog is list plus detail

- **GIVEN** a brand user on `/app/merchandise` Catalog on desktop with at least one SKU
- **THEN** the page uses `PipelineWorkspace`
- **AND** column 1 lists SKUs and column 2 shows the selected catalog card

#### Scenario: Desktop promo, orders, and payment tabs match catalog

- **GIVEN** a brand user on `/app/merchandise` on desktop
- **WHEN** they open Promo Codes, Orders, or Payment settings
- **THEN** each tab uses `PipelineWorkspace` with a list in column 1 and the selected item in column 2
- **AND** typing in search filters the current tab and does not switch to Catalog
- **AND** Promo Codes can add from the page header into the detail column
- **AND** Payment settings lists Payment mode, Razorpay, Invoice details, and Reminders

### Requirement: Competitions is not a Merchandise tab

The Merchandise page SHALL NOT include a Competitions tab.

#### Scenario: Merchandise catalog has no Competitions tab

- **GIVEN** brand staff is on `/app/merchandise`
- **WHEN** the page renders
- **THEN** section tabs are Catalog, Promo Codes, Orders, and Payment settings
- **AND** no Competitions tab is present

### Requirement: Pipeline chrome on center Merchandise

Center staff SHALL shop and track kit orders at `/app/merchandise` with the same pipeline chrome as Curriculum: page header, KPI stats strip, search, section tabs, and list + detail on desktop.

#### Scenario: Center shop chrome matches curriculum

- **GIVEN** a center user on `/app/merchandise`
- **THEN** the page uses `PipelinePageHeader` + `LeadKpiGrid` like Curriculum
- **AND** stats cards show Catalog, Unpaid, Orders, and Total
- **AND** section tabs remain Shop and My Orders
- **AND** desktop Shop keeps the catalog beside checkout in `PipelineWorkspace`
- **AND** Shop catalog cards are full-width horizontal rows (one SKU per row), not a two-column product grid
- **AND** desktop My Orders keeps order history beside allocations and shipping directory

#### Scenario: Shop catalog matches inventory list density

- **GIVEN** a center user on `/app/merchandise` Shop on desktop
- **THEN** each catalog SKU is a horizontal card spanning the list column
- **AND** the card header stays compact (thumbnail, name/SKU/badge, price) while quantity and **Add to Order** stack in a full-width footer so the add label is never clipped at Curriculum list width
- **AND** the desktop list/detail split matches Curriculum (`minmax(16rem, 0.95fr)` list, `minmax(0, 2.05fr)` detail)
- **AND** the list does not place two product cards side by side
