# UI shell standards

Applies to authenticated **app** layouts (`/admin`, `/app`), not marketing pages.

## Backend shell & KPI dashboards

Staff portals use `AppShell` with `surface="backend"` (default) → class `ed-shell--backend` on the root shell.

All `KpiGrid` / `KpiCard` inside the backend shell use the **compact dashboard** layout automatically (~1.5 rows on desktop, room for more metrics):

- Smaller padding and type
- 5 columns from 1024px, 6 from 1280px
- Applies to platform `/admin`, `/admin/revenue`, brand `/app`, `/app/analytics`, center `/app`, and brand detail performance KPIs when viewed inside platform admin chrome

No per-page `className` on `KpiGrid` is required. Marketing/public pages do not use this shell.

Tests: `apps/web/src/features/shared/backendKpiTheme.test.tsx`.

## Sidebar

- **Desktop:** collapsible left panel ([`packages/ui/src/shell.tsx`](../../packages/ui/src/shell.tsx)); state in `localStorage`
- **Tablet / mobile:** hidden by default; **hamburger** opens drawer overlay
- Nav definitions: [`portalNav.tsx`](../../apps/web/src/lib/portalNav.tsx) — must match [navigation-spec.md](./navigation-spec.md)

## Content grid

| Breakpoint | Columns | Typical use |
|------------|---------|-------------|
| Desktop (≥1024px) | **3** | List \| detail \| actions / filters |
| Tablet (≥768px) | **2** | List + detail stacked pairs |
| Mobile (&lt;768px) | **1** | Full-width cards; exceptions: horizontal KPI scroll |

Use **`PageGrid`**, **`PageGridFull`**, and **`FormGrid`** from `@edunudg/ui` (classes `ed-page-grid`, `ed-page-grid--3`, `ed-form-grid` in `packages/ui/src/styles.css`).

```tsx
import { PageGrid, PageGridFull, FormGrid } from "@edunudg/ui";

<PageGridFull>
  <Card title="Create">…</Card>
</PageGridFull>
<PageGrid cols={3}>
  <Card title="Queue A">…</Card>
  <Card title="Queue B">…</Card>
  <Card title="All">…</Card>
</PageGrid>
```

Do not stack many full-width `Card`s in a single column on laptop viewports.

## Marketing (public)

- Mobile-first CSS in [`marketing.css`](../../apps/web/src/features/marketing/marketing.css)
- Dual forms on brand host stack vertically on narrow viewports
- Center registration: single column form under brand nav

## Form fields (`@edunudg/ui`)

`Input`, `PasswordInput`, `Select`, and `Textarea` generate stable `id` and `name` from labels (for autofill and a11y). Labels use `htmlFor`. Override with optional `id` / `name` props when needed.

## Accessibility

- File inputs labeled (`htmlFor`) with `name` where applicable
- Marketing editor `EditorAccordion` (`HomepageEditorShell.tsx`): title + collapse control in `<summary>` only; **Visible on site** toggle lives in the accordion body
- Stale / lost lead states use text + icon, not color alone

## Personalized welcome (staff shells)

Brand, center, platform, and learn layouts use `useStaffShellWelcome()`:

- **Display name:** `profiles.full_name` when available, else auth metadata / email local-part (`resolveStaffDisplayName` in `portalUser.ts`).
- **Greeting:** time-of-day + first name (`buildWelcomeHeading` in `welcomeMessage.ts`).
- **Subtitle:** `{portalLabel} · {action hints}` when counts are non-zero (`useShellContextCounts` + `shellActionHints`).

Pass `welcomeHeading` and `welcomeSubtitle` into `AppShell`; the legacy `Welcome back, {name}` string remains the fallback when those props are omitted.

## Lead / application pipelines

Franchise applications, student leads (brand + center), and platform brand signups share the **pipeline** pattern from `@edunudg/ui`:

| Primitive | Use |
|-----------|-----|
| `PipelineMasterDetail` | List column + sticky detail column from 1024px |
| `FilterTabs` | Pill filters with optional counts (replaces lone `Select`) |
| `PipelineListItem` | Avatar, title, meta, badges, relative time |
| `KpiCard` + `onClick` | KPI strip doubles as filter shortcuts |
| `PipelineEmptyState` | Compact empty message + optional CTA |
| `PipelineDetailPlaceholder` | Desktop hint when no row is selected |

Styles use admin theme tokens (`--ed-primary-soft`, `--ed-card`, etc.) for light and dark mode.

Pages: `FranchiseApplicationsPage`, `StudentLeadsPage`, `CenterLeadsPage`, `PlatformSignupRequestsPanel`.

Tests: `FranchiseApplicationsPage.test.tsx`, `StudentLeadsPage.test.tsx`, `CenterLeadsPage.test.tsx`, `PlatformSignupRequestsPanel.test.tsx`, `welcomeMessage.test.ts`, `useShellContextCounts.test.ts`.

## Related

- [Navigation spec](./navigation-spec.md)
