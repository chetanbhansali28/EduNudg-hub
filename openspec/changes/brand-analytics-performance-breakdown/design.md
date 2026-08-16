## Context

Brand `/app/analytics` already loaded live enrollments and royalty settlements. The Performance Breakdown table treated that feed as a fake daily ledger (empty days Processed, frozen active-center count, royalty on billing period end).

## Goals / Non-Goals

**Goals:**
- Give a brand owner the network story in one short panel (headline + four snapshot facts + activity days).
- Show only days with real movement; pulse labels must match the event.
- Align chart, table, CSV, and KPI royalty window (paid-at, IST).

**Non-Goals:**
- New tables, RPCs, or a warehouse.
- Center-level P&L or student-level drill-in.
- Changing platform admin Performance card layout.

## Decisions

1. **Activity-only rows** — Quiet days stay in `recentDaily` for charts/trends but are omitted from the table so Processed-on-zero cannot return.
2. **Royalty collected = paid timestamp** — `updated_at` when `status = 'paid'`; pending settlements feed the “still due” snapshot, not daily rows.
3. **Centers column = centers that enrolled that IST day** — not the current network active count.
4. **Shared period state** — 14D/30D drives chart, snapshot, table, and CSV together.
5. **No schema change** — client aggregation over existing `student_enrollments` and `royalty_settlements`.

## Risks / Trade-offs

- Sparse brands will show an empty table plus a quiet headline — honest, less “busy.”
- If `updated_at` is not touched when marking paid, royalty day falls back to `period_end`.
- Unique centers across a period is not exact (daily counts only); peak-day center count is shown instead.
