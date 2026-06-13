## Decisions

### D1 — Master-detail layout

Reuse `PipelineMasterDetail` from leads/students. Col 1: course list. Col 2: course detail + nested level/units panels.

### D2 — Version safety

Levels and units belong to `curriculum_versions`. Edits require a **draft** version. If only published exists, `clone_curriculum_version_to_draft` RPC creates v+1 draft before edits.

### D3 — Publish gate

Publish requires ≥1 level. Only published versions appear on public site and center batch curriculum picker.

### D4 — Delete guards

`assert_level_deletable` blocks level delete when `student_level_progress` or active batch level ranges reference the level. Archive course blocked when centers authorized (client + confirm).
