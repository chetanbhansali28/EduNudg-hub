## Why

Brand Analytics Performance Breakdown filled every calendar day as “Processed,” copied today’s active-center count onto every row, and parked monthly royalty on `period_end`. Franchise owners could not tell in one glance what actually happened.

## What Changes

- Snapshot strip: enrollments vs prior window, royalty collected vs still due, peak day, live days — plus a one-line headline.
- Daily table lists only days with enrollments or collected royalty; pulse is Peak / Enrolling / Royalty in.
- Shared 14D/30D with the enrollment chart; CSV and period totals match the visible window.
- IST calendar buckets; royalty collected uses paid-at (`updated_at`); new enrollments exclude withdrawn.
- Section also appears on mobile (compact, no CSV).

## Capabilities

### New Capabilities

- `brand-analytics`: Brand `/app/analytics` live network metrics, including Performance Breakdown.

### Modified Capabilities

- (none)

## Impact

- `apps/web` analytics helpers/stats/view; `@edunudg/ui` table footer + pulse statuses.
- Docs: `docs/dashboards/kpi-spec.md`, `docs/navigation/brand.md`.
- Tests: Vitest regressions for quiet-day omission, IST bucketing, snapshot headline.
