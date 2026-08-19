## Why

Homepage course cards only tease the catalog. Spark/EduLearn **Enroll now** opens a lead modal; Abacus **Know More** is a short popup. Parents cannot open a shareable page with the full `/app/curriculum` marketing record (benefits, why parents choose, skills, scholarship, syllabus tree) while staying in the public theme chrome.

## What Changes

- Public route **`/courses/:slug`** on brand and center hosts, inside existing public layouts (same nav/footer/theme class as `/`).
- Cards and Abacus **Know More** (when the item matches a published program) navigate to that page.
- `brand_public_curriculum_json` includes program `id`; slugs are derived from name (collision suffix from id).
- Detail page renders all public curriculum marketing fields. **Enroll now** still opens the existing lead modal.
- Unknown or center-disabled slugs redirect to `/`.

## Capabilities

### New Capabilities

- `public-course-detail`: Public course URL, themed detail body, homepage links.

### Modified Capabilities

- `brand-curriculum-workspace`: published catalog is URL-addressable.
- `marketing-homepage`: `/courses/:slug` inherits theme chrome like `/about`.
- `center-public-profile`: center `/courses/:slug` uses enabled curriculum only.

## Impact

- SPA routes, Spark/EduLearn/Abacus/Novu course cards, public curriculum JSON, docs, Vitest + Playwright + SQL assertion.
