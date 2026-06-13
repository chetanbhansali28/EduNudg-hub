-- RLS smoke test: student journey batches, program authorization, self-join RPCs
-- Run via: pnpm test:rls

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'center_program_enablement'
  ) THEN
    RAISE EXCEPTION 'Missing center_program_enablement table';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'batch_join_events'
  ) THEN
    RAISE EXCEPTION 'Missing batch_join_events table';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'sync_center_program_enablement') THEN
    RAISE EXCEPTION 'Missing sync_center_program_enablement';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'upsert_center_batch') THEN
    RAISE EXCEPTION 'Missing upsert_center_batch';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'soft_delete_center_batch') THEN
    RAISE EXCEPTION 'Missing soft_delete_center_batch';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'join_student_batch') THEN
    RAISE EXCEPTION 'Missing join_student_batch';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_center_unseen_batch_joins') THEN
    RAISE EXCEPTION 'Missing get_center_unseen_batch_joins';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'mark_batch_joins_seen') THEN
    RAISE EXCEPTION 'Missing mark_batch_joins_seen';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'sync_student_batch_assignments') THEN
    RAISE EXCEPTION 'Missing sync_student_batch_assignments';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_student_program_ladders') THEN
    RAISE EXCEPTION 'Missing get_student_program_ladders';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_student_open_batches') THEN
    RAISE EXCEPTION 'Missing get_student_open_batches';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'batches' AND column_name = 'deleted_at'
  ) THEN
    RAISE EXCEPTION 'Missing batches.deleted_at';
  END IF;
  RAISE NOTICE 'RLS student journey batches smoke test passed';
END $$;
