-- =============================================================================
-- EduNudg test users — run in Supabase Dashboard → SQL Editor
-- =============================================================================
-- Self-contained: ensures dev brand/center exist (same IDs as seed.sql).
-- Optional: run seed.sql first for subscription plans + extra domain rows.
--
-- All accounts use password: admin
--
-- | Role        | Email                         | Portal / URL                          |
-- |-------------|-------------------------------|---------------------------------------|
-- | Platform    | admin@edunudg.com             | http://localhost:9000/admin           |
-- | Franchisor  | owner@edunudg.com             | http://abacusworld.localhost:9000     |
-- | Franchise   | center@edunudg.com            | http://koramangala.abacusworld.localhost:9000 |
-- | Student     | student@edunudg.com           | Data + auth (learn portal = Phase 2)  |
--
-- Re-run safe: uses fixed UUIDs and skips existing emails.
-- =============================================================================

-- Dev tenant (required for memberships / enrollments FKs)
INSERT INTO public.brands (id, slug, name, status)
VALUES (
  'a0000000-0000-4000-8000-000000000001',
  'abacusworld',
  'Abacus World',
  'active'
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  updated_at = now();

INSERT INTO public.franchise_centers (id, brand_id, slug, name, status, city)
VALUES (
  'b0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000001',
  'koramangala',
  'Abacus World Koramangala',
  'active',
  'Bengaluru'
)
ON CONFLICT (id) DO UPDATE SET
  brand_id = EXCLUDED.brand_id,
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  city = EXCLUDED.city,
  updated_at = now();

INSERT INTO public.domain_mappings (hostname, brand_id, center_id, portal_type, is_primary)
VALUES
  ('localhost', NULL, NULL, 'platform', true),
  ('127.0.0.1', NULL, NULL, 'platform', false),
  ('abacusworld.localhost', 'a0000000-0000-4000-8000-000000000001', NULL, 'brand', true),
  (
    'koramangala.abacusworld.localhost',
    'a0000000-0000-4000-8000-000000000001',
    'b0000000-0000-4000-8000-000000000001',
    'center',
    true
  )
ON CONFLICT (hostname) DO NOTHING;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Fixed IDs (do not change — referenced below)
-- Platform admin : f0000000-0000-4000-8000-000000000001
-- Brand owner    : f0000000-0000-4000-8000-000000000002
-- Center owner   : f0000000-0000-4000-8000-000000000003
-- Student auth   : f0000000-0000-4000-8000-000000000004
-- Student record : e0000000-0000-4000-8000-000000000001
-- Parent row     : 90000000-0000-4000-8000-000000000001
-- Parent link    : 90000000-0000-4000-8000-000000000002
-- Brand / center from seed.sql
-- Brand  : a0000000-0000-4000-8000-000000000001
-- Center : b0000000-0000-4000-8000-000000000001

DO $$
DECLARE
  v_instance_id uuid;
  v_password text := 'admin';
  v_encrypted_pw text;
BEGIN
  SELECT id INTO v_instance_id FROM auth.instances LIMIT 1;
  IF v_instance_id IS NULL THEN
    v_instance_id := '00000000-0000-0000-0000-000000000000';
  END IF;

  v_encrypted_pw := crypt(v_password, gen_salt('bf'));

  -- -------------------------------------------------------------------------
  -- 1) Platform admin
  -- -------------------------------------------------------------------------
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@edunudg.com') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, recovery_sent_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token,
      is_super_admin, phone
    ) VALUES (
      v_instance_id,
      'f0000000-0000-4000-8000-000000000001',
      'authenticated', 'authenticated',
      'admin@edunudg.com',
      v_encrypted_pw,
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Platform Admin"}'::jsonb,
      now(), now(),
      '', '', '', '',
      false, NULL
    );

    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      'f0000000-0000-4000-8000-000000000001',
      'f0000000-0000-4000-8000-000000000001',
      jsonb_build_object(
        'sub', 'f0000000-0000-4000-8000-000000000001',
        'email', 'admin@edunudg.com',
        'email_verified', true
      ),
      'email', now(), now(), now()
    );
  END IF;

  -- -------------------------------------------------------------------------
  -- 2) Franchisor (brand owner)
  -- -------------------------------------------------------------------------
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'owner@edunudg.com') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, recovery_sent_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token,
      is_super_admin, phone
    ) VALUES (
      v_instance_id,
      'f0000000-0000-4000-8000-000000000002',
      'authenticated', 'authenticated',
      'owner@edunudg.com',
      v_encrypted_pw,
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Brand Owner (Franchisor)"}'::jsonb,
      now(), now(),
      '', '', '', '',
      false, NULL
    );

    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      'f0000000-0000-4000-8000-000000000002',
      'f0000000-0000-4000-8000-000000000002',
      jsonb_build_object(
        'sub', 'f0000000-0000-4000-8000-000000000002',
        'email', 'owner@edunudg.com',
        'email_verified', true
      ),
      'email', now(), now(), now()
    );
  END IF;

  -- -------------------------------------------------------------------------
  -- 3) Franchise center owner
  -- -------------------------------------------------------------------------
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'center@edunudg.com') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, recovery_sent_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token,
      is_super_admin, phone
    ) VALUES (
      v_instance_id,
      'f0000000-0000-4000-8000-000000000003',
      'authenticated', 'authenticated',
      'center@edunudg.com',
      v_encrypted_pw,
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Center Owner (Franchise)"}'::jsonb,
      now(), now(),
      '', '', '', '',
      false, NULL
    );

    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      'f0000000-0000-4000-8000-000000000003',
      'f0000000-0000-4000-8000-000000000003',
      jsonb_build_object(
        'sub', 'f0000000-0000-4000-8000-000000000003',
        'email', 'center@edunudg.com',
        'email_verified', true
      ),
      'email', now(), now(), now()
    );
  END IF;

  -- -------------------------------------------------------------------------
  -- 4) Student (auth account — learn portal UI is Phase 2)
  -- -------------------------------------------------------------------------
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'student@edunudg.com') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, recovery_sent_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token,
      is_super_admin, phone
    ) VALUES (
      v_instance_id,
      'f0000000-0000-4000-8000-000000000004',
      'authenticated', 'authenticated',
      'student@edunudg.com',
      v_encrypted_pw,
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Test Student"}'::jsonb,
      now(), now(),
      '', '', '', '',
      false, NULL
    );

    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      'f0000000-0000-4000-8000-000000000004',
      'f0000000-0000-4000-8000-000000000004',
      jsonb_build_object(
        'sub', 'f0000000-0000-4000-8000-000000000004',
        'email', 'student@edunudg.com',
        'email_verified', true
      ),
      'email', now(), now(), now()
    );
  END IF;
END $$;

-- Profiles
INSERT INTO public.profiles (id, email, full_name)
VALUES
  ('f0000000-0000-4000-8000-000000000001', 'admin@edunudg.com', 'Platform Admin'),
  ('f0000000-0000-4000-8000-000000000002', 'owner@edunudg.com', 'Brand Owner (Franchisor)'),
  ('f0000000-0000-4000-8000-000000000003', 'center@edunudg.com', 'Center Owner (Franchise)'),
  ('f0000000-0000-4000-8000-000000000004', 'student@edunudg.com', 'Test Student')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  updated_at = now();

-- Memberships (RLS roles)
INSERT INTO public.memberships (
  id, user_id, scope_type, brand_id, center_id, role_key, status, accepted_at
)
VALUES
  (
    'c0000000-0000-4000-8000-000000000001',
    'f0000000-0000-4000-8000-000000000001',
    'platform', NULL, NULL,
    'platform_super_admin', 'active', now()
  ),
  (
    'c0000000-0000-4000-8000-000000000002',
    'f0000000-0000-4000-8000-000000000002',
    'brand',
    'a0000000-0000-4000-8000-000000000001', NULL,
    'brand_owner', 'active', now()
  ),
  (
    'c0000000-0000-4000-8000-000000000003',
    'f0000000-0000-4000-8000-000000000003',
    'center',
    'a0000000-0000-4000-8000-000000000001',
    'b0000000-0000-4000-8000-000000000001',
    'center_owner', 'active', now()
  )
ON CONFLICT (id) DO UPDATE SET
  role_key = EXCLUDED.role_key,
  status = 'active',
  accepted_at = now(),
  updated_at = now();

-- Student record (brand-owned) + active enrollment at Koramangala center
INSERT INTO public.students (
  id, brand_id, student_code, full_name, date_of_birth
)
VALUES (
  'e0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000001',
  'STU-001',
  'Test Student',
  '2015-06-15'
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  updated_at = now();

INSERT INTO public.student_enrollments (
  id, brand_id, center_id, student_id, status, enrolled_at
)
VALUES (
  'd0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000001',
  'b0000000-0000-4000-8000-000000000001',
  'e0000000-0000-4000-8000-000000000001',
  'active',
  now()
)
ON CONFLICT (id) DO UPDATE SET
  status = 'active',
  updated_at = now();

-- Optional: link student auth user to a parent row for future parent portal
INSERT INTO public.parents (
  id, brand_id, full_name, email, user_id
)
VALUES (
  '90000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000001',
  'Test Parent',
  'parent@edunudg.com',
  NULL
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.parent_student_links (
  id, brand_id, parent_id, student_id, relationship
)
VALUES (
  '90000000-0000-4000-8000-000000000002',
  'a0000000-0000-4000-8000-000000000001',
  '90000000-0000-4000-8000-000000000001',
  'e0000000-0000-4000-8000-000000000001',
  'guardian'
)
ON CONFLICT (parent_id, student_id) DO NOTHING;

-- Verify
SELECT u.email, p.full_name, m.scope_type, m.role_key, m.status
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.memberships m ON m.user_id = u.id AND m.status = 'active'
WHERE u.email LIKE '%@edunudg.com'
ORDER BY u.email;

SELECT s.student_code, s.full_name, fc.name AS center, se.status AS enrollment
FROM public.students s
JOIN public.student_enrollments se ON se.student_id = s.id
JOIN public.franchise_centers fc ON fc.id = se.center_id
WHERE s.id = 'e0000000-0000-4000-8000-000000000001';
