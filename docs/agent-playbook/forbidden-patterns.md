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

## Avoid

- Dense ERP-style data tables without mobile consideration
- God components > 300 lines — split into features
- Raw SQL in React components
- Hardcoded brand/center IDs in source

## Vibe-coding red flags

- "I'll add RLS later"
- "Quick mock auth for now"
- Inventing column names not in ERD
- Duplicate Supabase clients per component
