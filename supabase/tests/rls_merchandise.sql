-- RLS: merchandise orders scoped by center; brand sees all

BEGIN;

SELECT plan(6);

SELECT has_table('public', 'merchandise_catalog', 'merchandise_catalog exists');
SELECT has_column('public', 'merchandise_catalog', 'photo_urls', 'merchandise_catalog.photo_urls exists');
SELECT policies_are(
  'public',
  'merchandise_catalog',
  ARRAY['merchandise_catalog_brand', 'merchandise_catalog_center_read']
);
SELECT has_table('public', 'merchandise_orders', 'merchandise_orders exists');
SELECT has_table('public', 'merchandise_invoices', 'merchandise_invoices exists');
SELECT has_table('public', 'merchandise_reminder_log', 'merchandise_reminder_log exists');

SELECT * FROM finish();
ROLLBACK;
