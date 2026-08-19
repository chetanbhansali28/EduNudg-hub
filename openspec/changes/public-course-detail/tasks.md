## 1. Public identity

- [x] Add migration `093_public_curriculum_program_id.sql` so `brand_public_curriculum_json` includes `id`
- [x] Parse `id` and add slug/path/find helpers
- [x] SQL assertion that public JSON includes program id

## 2. Public page

- [x] Route `/courses/:slug` under brand and center public layouts
- [x] Themed detail body with curriculum fields and enroll CTA
- [x] Unknown slug redirects home

## 3. Homepage links

- [x] Spark/EduLearn cards link to the course page; Enroll now stays a modal button
- [x] Abacus Know More links when a published program matches
- [x] Novu course title links to the same route

## 4. Tests and sync

- [x] Vitest regressions, Playwright journey, docs/skills/OpenSpec main specs
