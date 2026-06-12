-- Student learn portal v2 RLS smoke

BEGIN;

SELECT plan(9);

SELECT has_table('public', 'student_competition_registrations', 'student_competition_registrations exists');

SELECT has_function('public', 'is_student_self', ARRAY['uuid', 'uuid'], 'is_student_self exists');
SELECT has_function('public', 'resolve_student_for_learn', ARRAY['uuid'], 'resolve_student_for_learn exists');
SELECT has_function('public', 'get_student_active_enrollment', ARRAY['uuid', 'uuid'], 'get_student_active_enrollment exists');
SELECT has_function('public', 'get_student_learn_home', ARRAY['uuid'], 'get_student_learn_home exists');
SELECT is(
  (SELECT p.provolatile
   FROM pg_proc p
   JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'get_student_learn_home'
   LIMIT 1),
  'v',
  'get_student_learn_home is VOLATILE (PostgREST read-only STABLE RPCs reject resolve_student_for_learn UPDATE)'
);
SELECT has_function('public', 'register_student_for_competition', ARRAY['uuid'], 'register_student_for_competition exists');
SELECT has_function('public', 'invite_student_portal_access', ARRAY['uuid', 'text'], 'invite_student_portal_access exists');
SELECT has_function('public', 'pin_enrollment_curriculum', ARRAY['uuid', 'uuid'], 'pin_enrollment_curriculum exists');

SELECT finish();
ROLLBACK;
