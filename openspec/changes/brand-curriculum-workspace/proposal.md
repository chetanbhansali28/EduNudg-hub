# Brand curriculum workspace — master-detail

## Why

Brand staff need a polished 2-column workspace to manage **courses** (programs), **levels**, and **units** with publish safety so franchise centers and student progress stay consistent.

## What

- `/app/curriculum` → master-detail: courses list | course detail
- CRUD for courses, levels, units; reorder levels/units
- Draft / publish workflow with clone-to-draft for live edits
- Impact hints (centers authorized, active batches)
- Guard deletes when student progress or batches reference levels

## Scope

- UI labels: Course / Level / Unit (maps to programs / levels / lessons)
- Out of scope: per-center curriculum version enablement (future franchise-center-management)
