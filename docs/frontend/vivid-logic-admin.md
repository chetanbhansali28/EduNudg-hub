# Vivid Logic admin UX

Admin portals (platform, brand, center) share the **Vivid Logic** design system in `packages/ui/src/styles.css`. Public marketing sites (`marketing.css`) are unchanged.

## Scope

| Layer | Route | Components |
|-------|-------|------------|
| Platform | `/admin/homepage` | `HomepageEditorPage`, `HomepageEditorForm`, `BrandMarketingThemesPanel` |
| Brand | `/app/homepage` | `BrandMarketingEditorPage`, `HomepageEditorForm` or theme-specific editor |
| Center template | `/app/homepage` (panel 2) | Same `HomepageEditorForm` as brand template |
| Center detail | `/app/centers/:slug` | `BrandCenterDetailPage` (read-only KPIs; styling only) |

Theme-specific editors (`AbacusClassicEditorForm`, future themes) reuse the same shell, accordion, and visibility patterns as `HomepageEditorForm`.

## Design tokens

- Primary: `#2563eb`
- Surface: `#faf8ff` (light)
- Radius: `8px`
- Font: Plus Jakarta Sans (loaded in `apps/web/index.html`)
- Nav active state: bold + primary color
- Button press: subtle scale on `:active`

Tokens live in CSS variables under `.ed-theme[data-theme="light"]` and `[data-theme="dark"]` in `packages/ui/src/styles.css`.

## Dark mode

Users choose light or dark in the **AppShell header** (`ThemeToggle`). Preference persists in `localStorage` key `edunudg-admin-theme` via `packages/ui/src/themePreference.ts`.

Both themes are fully supported; no system-preference auto-switch.

## Mobile navigation

Admin keeps the **sidebar overlay** drawer on small screens (not bottom nav). See `AppShell` in `packages/ui/src/shell.tsx`.

## Homepage editor patterns

### Shell (`HomepageEditorShell`)

- Page toolbar with **Save changes** (top)
- Fixed bottom **Save changes** bar on long forms when `onSave` is provided
- Multi-site layouts use `HomepageEditorPanel` per site with the same save label
- Exports shared **`EditorAccordion`** used by all homepage editor forms

### Accordions (`EditorAccordion` in `HomepageEditorShell.tsx`)

- Single-column stack (`.ed-homepage-editor` uses flex column — no 2-column grid)
- Collapsed by default; **title left, `+`/`−` right** on a full-width gray header bar
- Optional **Visible on site** toggle at the top of the accordion body (not in the header row)
- Section-off state dims body content

### Testimonials (inline in `HomepageEditorForm.tsx`)

Used when testimonials are not managed externally.

- Drag handle + move up/down reorder
- Soft character guidance: **50–100 characters** recommended (`testimonialEditorHelpers.ts`)
- Remove uses danger button styling

Abacus Classic / Spark Academy themes manage success stories elsewhere; their editors show an external hint only.

### Brand marketing themes (`BrandMarketingThemesPanel`)

Platform-only grid at `/admin/homepage`:

- Saved theme shows green badge + **Saved** button (disabled)
- Draft change shows **Unsaved changes** + primary **Update theme**

## Center detail page

`BrandCenterDetailPage` uses `.ed-detail-page`, `.ed-detail-page__subtitle`, and `.ed-detail-page__toolbar` for consistent spacing and actions. No new per-center landing editor — brand-level template at `/app/homepage` remains the source of truth.

## Automated tests

| Area | File |
|------|------|
| Theme preference | `apps/web/src/lib/adminThemePreference.test.ts` |
| App shell + theme toggle | `apps/web/src/features/auth/AppShell.responsive.test.tsx` |
| Editor shell + accordion | `apps/web/src/features/marketing/HomepageEditorShell.test.tsx` |
| Testimonials + section toggles | `apps/web/src/features/marketing/HomepageEditorForm.sections.test.tsx` |
| Quote helpers | `apps/web/src/lib/testimonialEditorHelpers.test.ts` |
| Themes panel | `apps/web/src/features/platform/BrandMarketingThemesPanel.test.tsx` |
| Center detail layout | `apps/web/src/features/brand/BrandCenterDetailPage.test.tsx` |

Run:

```bash
pnpm --filter @edunudg/ui test
pnpm --filter web test
```

## Manual QA checklist

### Theme & shell

- [ ] Toggle dark/light in platform, brand, and center portals; reload — preference persists
- [ ] Sidebar overlay opens/closes on mobile; desktop collapse still works
- [ ] Active nav item is bold and primary-colored

### Homepage editor

- [ ] Long form shows sticky bottom **Save changes**; top toolbar button also works
- [ ] Each accordion: title + `−`/`+` on top header bar; body fields always directly below that section
- [ ] Open a tall section (Hero / Why us) on a wide screen — next section header does not appear beside mid-content fields
- [ ] Testimonials: reorder via drag and move buttons; character hint warns below 50 or above 100
- [ ] Abacus Classic editor: same accordion/visibility UX; success stories hint only (no inline quotes)

### Platform themes panel

- [ ] Unchanged brand shows **Saved**; changing select enables **Update theme**
- [ ] After save, badge reflects new theme label

### Center detail

- [ ] `/app/centers/:slug` shows KPI grid, profile card, recent leads
- [ ] Toolbar: back link + open center site (when slug resolves)

## Related docs

- [Marketing landing pages](./marketing-landing.md) — public site themes and content
- [Abacus Classic theme](./abacus-classic.md) — theme-specific public sections and editor fields
