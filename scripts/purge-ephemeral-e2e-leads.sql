-- Permanently delete ephemeral E2E student leads (brand + center /app/leads).
-- Use a TEMP TABLE: CTEs do not persist across separate statements in the SQL editor.
-- Safe for seed brands only via name/email markers — never deletes real pipeline leads.
--
-- Run in Supabase SQL Editor. Prefer after migrations 070–071:
--   SELECT public.purge_ephemeral_e2e_leads();

BEGIN;

CREATE TEMP TABLE IF NOT EXISTS tmp_e2e_doomed_leads ON COMMIT DROP AS
SELECT l.id
FROM public.leads l
WHERE
  l.email ~* '^e2e-lead-.+@example\.com$'
  OR l.email ~* '^(path-a-|path-b-|lost-|merge-|stale-|manual-|neg-).+@example\.com$'
  OR l.parent_name ~* '^E2E Parent\b'
  OR l.child_name ~* '^E2E Child\b'
  OR l.full_name ~* '^E2E (Parent|Child)\b'
  OR l.parent_name IN (
    'Path A Parent', 'Path B Parent', 'Lost Parent', 'Merge Parent',
    'Stale Parent', 'Manual Brand Parent', 'Neg Parent'
  )
  OR l.child_name ~* '^(CenterChild|LostChild|StaleChild|ManualChild|Merge Child|Neg Child)\b'
  OR l.child_name ~* '^Child [a-z0-9]+$';

UPDATE public.students
SET source_lead_id = NULL, updated_at = now()
WHERE source_lead_id IN (SELECT id FROM tmp_e2e_doomed_leads);

DELETE FROM public.leads
WHERE id IN (SELECT id FROM tmp_e2e_doomed_leads);

-- Optional: converted E2E children left on seed brands (abacusworld / smart-brain-abacus)
DELETE FROM public.transfer_requests
WHERE student_id IN (
  SELECT s.id
  FROM public.students s
  JOIN public.brands b ON b.id = s.brand_id
  WHERE b.slug IN ('abacusworld', 'smart-brain-abacus')
    AND (
      s.full_name ~* '^E2E Child\b'
      OR s.full_name ~* '^(CenterChild|LostChild|StaleChild|ManualChild|Merge Child)\b'
      OR s.full_name ~* '^Child [a-z0-9]+$'
      OR coalesce(s.login_email, '') ~* '^e2e-lead-.+@example\.com$'
    )
);

DELETE FROM public.students s
USING public.brands b
WHERE s.brand_id = b.id
  AND b.slug IN ('abacusworld', 'smart-brain-abacus')
  AND (
    s.full_name ~* '^E2E Child\b'
    OR s.full_name ~* '^(CenterChild|LostChild|StaleChild|ManualChild|Merge Child)\b'
    OR s.full_name ~* '^Child [a-z0-9]+$'
    OR coalesce(s.login_email, '') ~* '^e2e-lead-.+@example\.com$'
  );

COMMIT;
