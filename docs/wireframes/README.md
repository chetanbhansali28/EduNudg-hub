# Wireframes (MVP)

Three screens per portal (dashboard, list, detail):

## Platform
- Command Center KPI grid (compact backend theme)
- Brands list with **Brand backend** / Edit
- Brand detail page — performance KPIs, brand settings, domains, franchise centers (no marketing theme card)

## Brand
- Executive dashboard
- Curriculum version list
- Center directory

## Center
- Operations dashboard
- Admissions pipeline
- Student detail + enrollment

Implement in `apps/web` using `@edunudg/ui` — staff dashboards use compact `KpiGrid` inside `ed-shell--backend`; list/detail sections use cards (not dense tables).
