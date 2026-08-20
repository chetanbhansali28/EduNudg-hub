## Context

`publicCurriculum` already carries course marketing + syllabus. There is no public course route and no program id/slug in JSON. Public chrome lives on `BrandPublicLayout` / `CenterPublicLayout`.

## Goals / Non-Goals

**Goals:** shareable `/courses/:slug`; full published curriculum fields; theme-matched cinematic hero + sticky enroll card; keep Enroll modal; center enablement filter.

**Non-Goals:** staff `/app/curriculum` URLs; `programs.slug` column; removing homepage syllabus; feature flag.

## Decisions

- Path `/courses/:slug` under both public layouts (copy `/about`, do not re-wrap `marketing-page--*`).
- Expose `id` in `brand_public_curriculum_json`; slugify name client-side; disambiguate with short id suffix.
- Spark/EduLearn: media + title link to detail; **Enroll now** stays a modal button.
- Abacus: **Know More** is a `Link` when the card matches a published program; leftover homepage-only cards keep the modal.
- Missing slug → `Navigate` to `/`.

## Risks / Trade-offs

- Name-based slugs change if staff rename a course (acceptable until a slug column is needed).
- Duplicate names need id suffix; old URLs without suffix still match the first program.
