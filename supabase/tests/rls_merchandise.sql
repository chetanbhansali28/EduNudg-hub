-- RLS: merchandise orders scoped by center; brand sees all

BEGIN;

SELECT plan(4);

SELECT has_table('public', 'merchandise_catalog', 'merchandise_catalog exists');
SELECT has_table('public', 'merchandise_orders', 'merchandise_orders exists');
SELECT has_table('public', 'merchandise_invoices', 'merchandise_invoices exists');
SELECT has_table('public', 'merchandise_reminder_log', 'merchandise_reminder_log exists');

SELECT * FROM finish();
ROLLBACK;
