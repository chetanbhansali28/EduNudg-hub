# Vivid Logic admin UX

Admin portals (platform, brand, center) share the **Vivid Logic** design system in `packages/ui/src/styles.css`. Public marketing sites (`marketing.css`) are unchanged.

## Scope

| Layer | Route | Components |
|-------|-------|------------|
| Platform | `/admin/homepage` | `HomepageEditorPage`, `HomepageEditorForm`, `BrandMarketingThemesPanel` |
| Brand | `/app/homepage` | `BrandMarketingEditorPage`, `HomepageEditorForm` or theme-specific editor |
| Center template | `/app/homepage` (panel 2) | Same `HomepageEditorForm` as brand template |
| Center detail | `/app/centers/:slug` | `BrandCenterDetailPage` (read-only KPIs; styling only) |

Theme-specific editors (`AbacusClassicEditorForm`, future themes) reuse `HomepageEditorShell`, `HomepageEditorSections`, and `EditorAccordion`.

## Design tokens

Material-inspired palette (ported from mockups, implemented as CSS variables — **not Tailwind**):

- Primary container: `#2563eb`
- Surface / background: `#faf8ff`
- Outline variant: `#c3c6d7`
- Editor card radius: `1.5rem` (`--ed-radius-editor`)
- Headlines: **Plus Jakarta Sans**; body labels/inputs: **Inter**
- Icons: **Material Symbols Outlined** (loaded in `apps/web/index.html`)

Mobile navigation remains **sidebar overlay** (no bottom nav bar).

## Dark mode

Users choose light or dark in the **AppShell header** (`ThemeToggle`). Preference persists in `localStorage` key `edunudg-admin-theme`.

## Homepage editor patterns

### Hero card (`HomepageEditorShell`)

- Gradient promo card with page title, subtitle, and full-width **Save changes** button (Material `save` icon)
- Sticky bottom save bar on **mobile only** (hidden on desktop ≥1024px)
- `HomepageEditorPanel` uses the same hero pattern for brand + center template panels

### Accordions (`EditorAccordion` + `HomepageEditorSections`)

- **Single-open** behaviour: opening one section closes others
- Collapsed row: colored icon tile + title + subtitle + Material `add` icon
- Expanded row: icon + title; **Visible on site** toggle + `remove` collapse control
- Section metadata in `HOMEPAGE_EDITOR_SECTION_META` (`HomepageEditorShell.tsx`)
- Active open section: primary border + elevated shadow

### Two-column field layout (all accordion sections)

Every homepage editor section (Novu `HomepageEditorForm` and theme editors such as `AbacusClassicEditorForm`) uses shared layout helpers exported from `HomepageEditorShell.tsx`:

| Helper | Purpose |
|--------|---------|
| `EditorFieldsGrid` | Two-column `FormGrid` from tablet up; wraps fields in `ed-editable-form` |
| `EditorFieldSpan` | Full-width row for media uploads, long copy, or toggles |
| `EditorSectionNote` | Muted intro copy above repeatable blocks |
| `EditorItemPanel` | Card panel for one list item (nav link, FAQ, program card, etc.) with red **Remove** |
| `EditorItemList` | Stack of panels + centered blue **+ Add** button |
| `EditorGroupedPanel` | Dashed inset group (e.g. program benefits in Know More modal) |
| `EditorSubItem` | Nested row inside a grouped panel with inline remove |

Styles live in `packages/ui/src/styles.css` under `.ed-editor-item-panel`, `.ed-editor-item-list`, `.ed-editor-grouped-panel` (legacy `.ed-program-card-editor*` aliases remain for compatibility).

### Testimonials (split layout in `HomepageEditorForm.tsx`)

When testimonials are managed inline (Novu theme):

- Left column (desktop): section title, subtitle, editor tip (50–100 chars)
- Right column: draggable testimonial cards, add/remove

Abacus Classic / Spark Academy: success stories external — no split layout.

### Brand marketing themes (`BrandMarketingThemesPanel`)

Platform-only bento grid at `/admin/homepage`:

- Header with uppercase `{N} brands` pill
- Two-column brand cards on desktop (12-col grid, span 6)
- Theme badge per brand; **Saved** (check icon) vs primary **Update theme**

## Automated tests

| Area | File |
|------|------|
| Theme preference | `apps/web/src/lib/adminThemePreference.test.ts` |
| App shell + theme toggle | `apps/web/src/features/auth/AppShell.responsive.test.tsx` |
| Editor shell + accordion | `apps/web/src/features/marketing/HomepageEditorShell.test.tsx` |
| Two-column layout helpers | `HomepageEditorShell.test.tsx` (`Homepage editor layout helpers`) |
| Testimonials + section toggles | `apps/web/src/features/marketing/HomepageEditorForm.sections.test.tsx` |
| Quote helpers | `apps/web/src/lib/testimonialEditorHelpers.test.ts` |
| Themes panel | `apps/web/src/features/platform/BrandMarketingThemesPanel.test.tsx` |
| Center detail layout | `apps/web/src/features/brand/BrandCenterDetailPage.test.tsx` |

Run:

```bash
pnpm --filter web test -- HomepageEditorShell HomepageEditorForm BrandMarketingThemesPanel
```

## Manual QA checklist

### Theme & shell

- [ ] Toggle dark/light; reload — preference persists
- [ ] Sidebar overlay on mobile (no bottom nav)
- [ ] Desktop: sidebar + content layout unchanged

### Homepage editor (Admin, Brand, Center template)

- [ ] Hero card shows title, subtitle, **Save changes**
- [ ] Mobile: sticky bottom save bar; desktop: hero save only
- [ ] Accordions: icon + subtitle when collapsed; only one open at a time
- [ ] Visible on site toggle appears when section is expanded
- [ ] All accordion bodies use two-column field grids on tablet+ (Site, Hero, Navigation items, FAQ, etc.)
- [ ] Repeatable items use card panels with blue **+ Add** and red **Remove** buttons
- [ ] Programs grid benefits use dashed grouped panel (Abacus Classic)
- [ ] Testimonials split layout on tablet/desktop; stacked on mobile
- [ ] Abacus Classic: same accordion chrome; success stories hint only

### Platform themes panel

- [ ] Bento grid on desktop; single column on mobile
- [ ] **Saved** with check icon when unchanged; **Update theme** when draft differs

### Center detail

- [ ] `/app/centers/:slug` KPI grid and toolbar unchanged functionally

## Related docs

- [Marketing landing pages](./marketing-landing.md)
- [Abacus Classic theme](./abacus-classic.md)
