-- Permanently remove E2E brand subscriptions (and their brands) from /admin/subscriptions.
-- Uses TEMP TABLE (CTEs do not persist across statements in the SQL Editor).
-- Does NOT delete seed subscription_plans (starter / growth / enterprise).
-- Prefer after migration 072: SELECT public.purge_ephemeral_e2e_brands();

BEGIN;

CREATE TEMP TABLE IF NOT EXISTS tmp_e2e_doomed_brands ON COMMIT DROP AS
SELECT b.id
FROM public.brands b
WHERE b.slug NOT IN ('abacusworld', 'smart-brain-abacus')
  AND (
    b.name ~* '^E2E Brand\b'
    OR b.slug ~* '^e2e-brand-'
  );

-- Subscriptions first (also cascades when brands are deleted below).
DELETE FROM public.brand_subscriptions
WHERE brand_id IN (SELECT id FROM tmp_e2e_doomed_brands);

UPDATE public.platform_brand_signups
SET converted_brand_id = NULL, updated_at = now()
WHERE converted_brand_id IN (SELECT id FROM tmp_e2e_doomed_brands);

DELETE FROM public.platform_audit_logs
WHERE brand_id IN (SELECT id FROM tmp_e2e_doomed_brands)
   OR coalesce(payload->>'requested_name', '') ~* '^E2E Brand\b'
   OR coalesce(payload->>'email', '') ~* '^e2e-brand-.+@example\.com$'
   OR coalesce(payload->>'slug', '') ~* '^e2e-brand-';

DELETE FROM public.platform_invoices
WHERE brand_id IN (SELECT id FROM tmp_e2e_doomed_brands);

DELETE FROM public.financial_events
WHERE brand_id IN (SELECT id FROM tmp_e2e_doomed_brands);

DELETE FROM public.enrollment_history
WHERE brand_id IN (SELECT id FROM tmp_e2e_doomed_brands);

DELETE FROM public.transfer_requests
WHERE brand_id IN (SELECT id FROM tmp_e2e_doomed_brands);

DELETE FROM public.support_tickets
WHERE brand_id IN (SELECT id FROM tmp_e2e_doomed_brands);

DELETE FROM public.brands
WHERE id IN (SELECT id FROM tmp_e2e_doomed_brands);

DELETE FROM public.platform_brand_signups
WHERE email ~* '^e2e-brand-.+@example\.com$'
   OR requested_name ~* '^E2E Brand\b';

COMMIT;
