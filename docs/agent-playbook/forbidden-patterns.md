# Forbidden Patterns

## Never

1. Add Next.js, Remix, or React Server Components
2. Put `SUPABASE_SERVICE_ROLE_KEY` in client code or `.env` committed to git
3. Create tables without migrations
4. Ship features without tests
5. Use `USING (true)` RLS except documented reference data
6. Delete or edit production-applied migrations — add new migration instead
7. Store student academic history only on `center_id` without `enrollment_id`
8. Skip `updated_by` on mutable tables
9. Ship behavior/process changes without syncing OpenSpec, docs, skills, and agents (`artifact-sync`)
10. Cross agent role fences without escalation (`agent-boundaries`)
11. `git push` / publish to GitHub (or commit) without an explicit user request (`git-publish-gate`)
12. Push without a green `pnpm ci:local` for current HEAD, skip auto-fix, or chain `commit && push` without CI in between (`edunudg-pre-push-ci` / `git-publish-gate`)
13. Ask the user for permission to update specs/docs/tests/skills — sync automatically (`artifact-sync`)
14. Invent `SKIP_CI_LOCAL=1` without explicit user emergency approval
15. Discard platform/brand/center marketing config or `brand-assets` URLs because of Novu markers, theme defaults, seed overwrite, or editor save of stock Unsplash (`marketing-homepage-media`)
16. Save `/admin/homepage`, brand `/app/homepage`, or `/app/center-site` while the UI shows substituted Unsplash defaults over a customized DB row
17. `brand_settings` seed/upsert that full-replaces `settings` (`settings = EXCLUDED.settings`) — existing content must win

## Avoid

- Dense ERP-style data tables without mobile consideration
- God components > 300 lines — split into features
- Raw SQL in React components
- Hardcoded brand/center IDs in source
- Adding major flows by editing unrelated existing page files — use a new feature module
- `getSupabase()` / OAuth / payment SDK calls directly in page components — use `services/`
- Shipping integrations without an OFF feature flag
- Center marking leads lost from brand UI (center only); brand may reopen via `reopen_lead` or WhatsApp re-apply auto-reopens
- “Docs/tests/skills later” — sync in the same change
- Raw multi-byte glyphs in CSS `content` (e.g. `✓`) — use `\2713` so production minify cannot show `â`

## Vibe-coding red flags

- "I'll add RLS later"
- "Quick mock auth for now"
- Duplicate numeric prefixes (`089_foo.sql` and `089_bar.sql`) — only one migration version applies; the other schema never lands (lead CSV columns vs merchandise SETOF was `089`)
- Duplicate Supabase clients per component
- "Skip OpenSpec / agent brief updates this once"
