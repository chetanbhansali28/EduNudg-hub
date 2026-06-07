-- Dev seed — run in Supabase Dashboard → SQL Editor after `supabase db push`
-- Safe to re-run: upserts by slug / hostname only (no fixed brand UUIDs).

INSERT INTO public.subscription_plans (code, name, price_cents, currency, billing_interval)
VALUES
  ('starter', 'Starter', 999900, 'INR', 'month'),
  ('growth', 'Growth', 2499900, 'INR', 'month'),
  ('enterprise', 'Enterprise', 4999900, 'INR', 'month')
ON CONFLICT (code) DO NOTHING;

-- Abacus World (Novu theme)
INSERT INTO public.brands (slug, name, status, marketing_theme)
VALUES ('abacusworld', 'Abacus World', 'active', 'novu')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  marketing_theme = EXCLUDED.marketing_theme;

INSERT INTO public.franchise_centers (brand_id, slug, name, status, city)
SELECT b.id, 'koramangala', 'Abacus World Koramangala', 'active', 'Bengaluru'
FROM public.brands b
WHERE b.slug = 'abacusworld'
ON CONFLICT (brand_id, slug) DO UPDATE SET
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  city = EXCLUDED.city;

INSERT INTO public.domain_mappings (hostname, brand_id, center_id, portal_type, is_primary)
VALUES
  ('localhost', NULL, NULL, 'platform', true),
  ('127.0.0.1', NULL, NULL, 'platform', false),
  ('admin.localhost', NULL, NULL, 'platform', false)
ON CONFLICT (hostname) DO NOTHING;

INSERT INTO public.domain_mappings (hostname, brand_id, center_id, portal_type, is_primary)
SELECT 'abacusworld.localhost', b.id, NULL, 'brand', true
FROM public.brands b
WHERE b.slug = 'abacusworld'
ON CONFLICT (hostname) DO UPDATE SET
  brand_id = EXCLUDED.brand_id,
  portal_type = EXCLUDED.portal_type,
  is_primary = EXCLUDED.is_primary;

INSERT INTO public.domain_mappings (hostname, brand_id, center_id, portal_type, is_primary)
SELECT
  'koramangala.abacusworld.localhost',
  b.id,
  fc.id,
  'center',
  true
FROM public.brands b
JOIN public.franchise_centers fc ON fc.brand_id = b.id AND fc.slug = 'koramangala'
WHERE b.slug = 'abacusworld'
ON CONFLICT (hostname) DO UPDATE SET
  brand_id = EXCLUDED.brand_id,
  center_id = EXCLUDED.center_id,
  portal_type = EXCLUDED.portal_type,
  is_primary = EXCLUDED.is_primary;

INSERT INTO public.brand_settings (brand_id, settings)
SELECT
  b.id,
  '{"timezone":"Asia/Kolkata","landing":{"hero":{"subtitle":"Train young minds with a proven abacus program—launch your Abacus World center with full curriculum and ops support."}}}'::jsonb
FROM public.brands b
WHERE b.slug = 'abacusworld'
ON CONFLICT (brand_id) DO UPDATE SET settings = EXCLUDED.settings;

INSERT INTO public.brand_themes (brand_id, tokens)
SELECT b.id, '{"primary":"#2563eb","radius":"0.5rem"}'::jsonb
FROM public.brands b
WHERE b.slug = 'abacusworld'
ON CONFLICT (brand_id) DO NOTHING;

-- Smart Brain Abacus (Abacus Classic theme)
INSERT INTO public.brands (slug, name, status, marketing_theme)
VALUES ('smart-brain-abacus', 'Smart Brain Abacus', 'active', 'abacus-classic')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  marketing_theme = EXCLUDED.marketing_theme;

INSERT INTO public.domain_mappings (hostname, brand_id, center_id, portal_type, is_primary)
SELECT 'smart-brain-abacus.localhost', b.id, NULL, 'brand', true
FROM public.brands b
WHERE b.slug = 'smart-brain-abacus'
ON CONFLICT (hostname) DO UPDATE SET
  brand_id = EXCLUDED.brand_id,
  portal_type = EXCLUDED.portal_type,
  is_primary = EXCLUDED.is_primary;

INSERT INTO public.brand_settings (brand_id, settings)
SELECT b.id, '{"timezone":"Asia/Kolkata"}'::jsonb
FROM public.brands b
WHERE b.slug = 'smart-brain-abacus'
ON CONFLICT (brand_id) DO UPDATE SET settings = EXCLUDED.settings;

INSERT INTO public.brand_themes (brand_id, tokens)
SELECT b.id, '{"primary":"#2563eb","radius":"0.5rem"}'::jsonb
FROM public.brands b
WHERE b.slug = 'smart-brain-abacus'
ON CONFLICT (brand_id) DO NOTHING;
