-- Phase D: student learn + kit allocation RLS smoke

BEGIN;

SELECT plan(4);

SELECT has_table('public', 'student_level_progress', 'student_level_progress exists');
SELECT has_table('public', 'brand_competitions', 'brand_competitions exists');
SELECT has_table('public', 'student_competition_entries', 'student_competition_entries exists');

SELECT has_function('public', 'get_student_learn_dashboard', ARRAY['uuid'], 'learn dashboard RPC exists');

SELECT finish();
ROLLBACK;
