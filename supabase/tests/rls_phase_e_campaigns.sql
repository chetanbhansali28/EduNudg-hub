-- Phase E: campaigns, assessments, RPC hardening smoke

BEGIN;

SELECT plan(6);

SELECT has_table('public', 'student_assessments', 'student_assessments exists');
SELECT has_function('public', 'upsert_brand_campaign', ARRAY['uuid', 'text', 'text', 'text', 'timestamptz', 'timestamptz', 'boolean', 'uuid']);
SELECT has_function('public', 'list_active_brand_campaigns', ARRAY['uuid']);
SELECT has_function('public', 'record_student_assessment', ARRAY['uuid', 'uuid', 'text', 'numeric', 'numeric', 'date', 'text']);
SELECT has_function('public', 'get_center_ops_report', ARRAY['uuid']);

SELECT policy_is(
  'public', 'leads', 'leads_center_select', 'SELECT', 'authenticated',
  'leads center policy is select-only after hardening'
);

SELECT finish();
ROLLBACK;
