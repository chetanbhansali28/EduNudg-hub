-- Dev seed — run in Supabase Dashboard → SQL Editor after `supabase db push`

INSERT INTO public.subscription_plans (code, name, price_cents, currency, billing_interval)
VALUES
  ('starter', 'Starter', 999900, 'INR', 'month'),
  ('growth', 'Growth', 2499900, 'INR', 'month'),
  ('enterprise', 'Enterprise', 4999900, 'INR', 'month')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.brands (id, slug, name, status)
VALUES (
  'a0000000-0000-4000-8000-000000000001',
  'abacusworld',
  'Abacus World',
  'active'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.franchise_centers (id, brand_id, slug, name, status, city)
VALUES (
  'b0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000001',
  'koramangala',
  'Abacus World Koramangala',
  'active',
  'Bengaluru'
) ON CONFLICT (brand_id, slug) DO NOTHING;

INSERT INTO public.domain_mappings (hostname, brand_id, center_id, portal_type, is_primary)
VALUES
  ('localhost', NULL, NULL, 'platform', true),
  ('127.0.0.1', NULL, NULL, 'platform', false),
  ('admin.localhost', NULL, NULL, 'platform', false),
  ('abacusworld.localhost', 'a0000000-0000-4000-8000-000000000001', NULL, 'brand', true),
  ('koramangala.abacusworld.localhost', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'center', true)
ON CONFLICT (hostname) DO NOTHING;

INSERT INTO public.brand_settings (brand_id, settings)
VALUES (
  'a0000000-0000-4000-8000-000000000001',
  '{"timezone":"Asia/Kolkata","landing":{"hero":{"subtitle":"Train young minds with a proven abacus program—launch your Abacus World center with full curriculum and ops support."}}}'
)
ON CONFLICT (brand_id) DO UPDATE SET settings = EXCLUDED.settings;

INSERT INTO public.brand_themes (brand_id, tokens)
VALUES ('a0000000-0000-4000-8000-000000000001', '{"primary":"#2563eb","radius":"0.5rem"}')
ON CONFLICT (brand_id) DO NOTHING;
