# Brand Analytics

Brand staff `/app/analytics` shows live franchise-network metrics from enrollments, centers, and royalty settlements (read-only, no manual snapshots).

## Requirements

### Requirement: Performance Breakdown is a scannable network pulse

The Performance Breakdown section SHALL open with a one-line headline and four snapshot facts for the selected 14- or 30-day window: new enrollments vs the prior equal window, royalty collected vs settlements still due, peak enrollment day, and how many days in the window had activity. The daily table SHALL list only days with new enrollments or royalty collected. Pulse SHALL be `Peak day`, `Enrolling`, or `Royalty in` — never `Processed` on a zero-activity day. The Centers column SHALL be the count of centers that enrolled that calendar day (IST), not the current network active-center snapshot. Royalty collected SHALL use the paid timestamp when present. Chart, snapshot, table, CSV, and period totals SHALL share the same 14D/30D control. A From/To calendar SHALL filter that same window immediately (within the loaded IST trend days) without replacing the presets — choosing 14D or 30D clears a custom range. Export CSV SHALL download the visible window (UTF-8 BOM, filename includes preset or from-to dates) on desktop and mobile.

#### Scenario: Custom dates update the table and CSV window

- **GIVEN** loaded daily metrics covering the last 60 IST days
- **WHEN** the brand owner picks From and To dates
- **THEN** the snapshot, table, chart, and Export CSV SHALL use that inclusive range immediately
- **AND** 14D / 30D SHALL remain available and restore the preset window
- **AND** dates outside the loaded trend SHALL clamp to available data

#### Scenario: Quiet days are omitted

- **GIVEN** a 14-day window with enrollments on two days and zeros elsewhere
- **WHEN** the brand owner opens `/app/analytics`
- **THEN** Performance Breakdown lists only those two days
- **AND** the peak day is highlighted
- **AND** no row is labeled Processed solely because enrollments and royalty are zero

#### Scenario: Headline explains the period

- **GIVEN** enrollments and a leading center in the window
- **WHEN** the snapshot renders
- **THEN** the headline includes enrollment count, royalty collected, and the leading center name
- **AND** if the window is empty the headline states it is a quiet period

#### Scenario: Royalty still due is visible without faking daily cash

- **GIVEN** unpaid `royalty_settlements` exist
- **WHEN** the snapshot renders
- **THEN** Royalty collected uses paid-at amounts in the window
- **AND** the royalty card hint shows the pending settlement total
