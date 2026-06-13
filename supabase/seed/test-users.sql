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
-- | Student     | student@edunudg.com           | http://learn.abacusworld.localhost:9000/login |
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
  ),
  (
    'learn.abacusworld.localhost',
    'a0000000-0000-4000-8000-000000000001',
    NULL,
    'learn',
    false
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
  -- 4) Student / parent auth (learn portal)
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
  'student@edunudg.com',
  'f0000000-0000-4000-8000-000000000004'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  user_id = EXCLUDED.user_id,
  updated_at = now();

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

-- Student learn portal v2 demo data (student-first auth)
UPDATE public.students
SET user_id = 'f0000000-0000-4000-8000-000000000004',
    login_email = 'student@edunudg.com',
    updated_at = now()
WHERE id = 'e0000000-0000-4000-8000-000000000001';

-- Student auth takes precedence over legacy parent link on same email
UPDATE public.parents
SET user_id = NULL, updated_at = now()
WHERE id = '90000000-0000-4000-8000-000000000001';

INSERT INTO public.programs (id, brand_id, name, is_active)
VALUES (
  'f1000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000001',
  'Abacus Core',
  true
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = now();

-- Student journey: authorize Abacus program for Koramangala demo center
INSERT INTO public.center_program_enablement (brand_id, center_id, program_id)
VALUES (
  'a0000000-0000-4000-8000-000000000001',
  'b0000000-0000-4000-8000-000000000001',
  'f1000000-0000-4000-8000-000000000001'
)
ON CONFLICT (center_id, program_id) DO NOTHING;

UPDATE public.student_enrollments
SET program_id = 'f1000000-0000-4000-8000-000000000001', updated_at = now()
WHERE id = 'd0000000-0000-4000-8000-000000000001';

INSERT INTO public.levels (id, program_id, brand_id, name, sort_order, abacus_level_code)
VALUES
  ('f2000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Level 1', 1, 'L1'),
  ('f2000000-0000-4000-8000-000000000002', 'f1000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Level 2', 2, 'L2'),
  ('f2000000-0000-4000-8000-000000000003', 'f1000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Level 3', 3, 'L3'),
  ('f2000000-0000-4000-8000-000000000004', 'f1000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Level 4', 4, 'L4'),
  ('f2000000-0000-4000-8000-000000000005', 'f1000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Level 5', 5, 'L5'),
  ('f2000000-0000-4000-8000-000000000006', 'f1000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Level 6', 6, 'L6'),
  ('f2000000-0000-4000-8000-000000000007', 'f1000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Level 7', 7, 'L7'),
  ('f2000000-0000-4000-8000-000000000008', 'f1000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Level 8', 8, 'L8')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, program_id = EXCLUDED.program_id, updated_at = now();

INSERT INTO public.student_profiles (brand_id, student_id, school_name, city, pincode)
VALUES (
  'a0000000-0000-4000-8000-000000000001',
  'e0000000-0000-4000-8000-000000000001',
  'Demo Public School',
  'Bengaluru',
  '560034'
)
ON CONFLICT (student_id) DO UPDATE SET
  school_name = EXCLUDED.school_name,
  city = EXCLUDED.city,
  pincode = EXCLUDED.pincode,
  updated_at = now();

INSERT INTO public.student_level_progress (
  id, brand_id, center_id, student_id, enrollment_id, level_id, level_name, status, completed_at
)
VALUES
  ('f3000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'f2000000-0000-4000-8000-000000000001', 'Level 1', 'completed', now() - interval '60 days'),
  ('f3000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'f2000000-0000-4000-8000-000000000002', 'Level 2', 'completed', now() - interval '30 days'),
  ('f3000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'f2000000-0000-4000-8000-000000000003', 'Level 3', 'in_progress', NULL)
ON CONFLICT (student_id, level_name) DO UPDATE SET
  status = EXCLUDED.status, level_id = EXCLUDED.level_id, enrollment_id = EXCLUDED.enrollment_id, updated_at = now();

INSERT INTO public.student_assessments (
  id, brand_id, center_id, student_id, enrollment_id, assessment_type, score, max_score, assessed_at, visible_to_student
)
VALUES
  ('f4000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'level_check', 85, 100, (now() AT TIME ZONE 'Asia/Kolkata')::date - 45, true),
  ('f4000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'level_check', 90, 100, (now() AT TIME ZONE 'Asia/Kolkata')::date - 30, true),
  ('f4000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'mock_exam', 78, 100, (now() AT TIME ZONE 'Asia/Kolkata')::date - 14, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.brand_competitions (
  id, brand_id, name, event_date, location, is_active, fee_type, registration_mode,
  registration_opens_at, registration_closes_at
)
VALUES
  (
    'f5000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    'Regional Abacus Challenge',
    (now() AT TIME ZONE 'Asia/Kolkata')::date + 30,
    'Bengaluru',
    true,
    'free',
    'open',
    now() - interval '1 day',
    now() + interval '20 days'
  ),
  (
    'f5000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000001',
    'National Championship',
    (now() AT TIME ZONE 'Asia/Kolkata')::date + 60,
    'Mumbai',
    true,
    'paid',
    'open',
    now() - interval '1 day',
    now() + interval '45 days'
  ),
  (
    'f5000000-0000-4000-8000-000000000003',
    'a0000000-0000-4000-8000-000000000001',
    'Winter Open 2025',
    (now() AT TIME ZONE 'Asia/Kolkata')::date - 60,
    'Bengaluru',
    true,
    'free',
    'closed',
    NULL,
    NULL
  )
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, fee_type = EXCLUDED.fee_type, updated_at = now();

INSERT INTO public.student_competition_entries (
  id, brand_id, center_id, student_id, enrollment_id, competition_id, result_rank, rank_position, score
)
VALUES (
  'f6000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000001',
  'b0000000-0000-4000-8000-000000000001',
  'e0000000-0000-4000-8000-000000000001',
  'd0000000-0000-4000-8000-000000000001',
  'f5000000-0000-4000-8000-000000000003',
  '2nd place',
  2,
  92
)
ON CONFLICT (student_id, competition_id) DO UPDATE SET
  result_rank = EXCLUDED.result_rank, rank_position = EXCLUDED.rank_position, updated_at = now();

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
