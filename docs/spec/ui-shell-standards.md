# UI shell standards

Applies to authenticated **app** layouts (`/admin`, `/app`), not marketing pages.

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

## Accessibility

- File inputs labeled (`htmlFor`)
- Stale / lost lead states use text + icon, not color alone

## Related

- [Navigation spec](./navigation-spec.md)
