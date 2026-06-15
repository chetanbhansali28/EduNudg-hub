-- Attendance tables removed; ops report no longer references sessions.

BEGIN;

SELECT plan(3);

SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'attendance_sessions'
  ),
  'attendance_sessions table dropped'
);

SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'attendance_records'
  ),
  'attendance_records table dropped'
);

SELECT has_function('public', 'get_center_ops_report', ARRAY['uuid']);

SELECT finish();
ROLLBACK;
