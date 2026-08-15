-- Competitions module: independent feature flag, question bank, snapshots, student quiz.

-- ---------------------------------------------------------------------------
-- Flag: competitions defaults OFF
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.brand_feature_enabled(p_brand_id uuid, p_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_key = 'merchandise' THEN COALESCE(
      (SELECT (bs.settings -> 'features' ->> 'merchandise')::boolean FROM public.brand_settings bs WHERE bs.brand_id = p_brand_id),
      (SELECT (bs.settings -> 'features' ->> 'kits')::boolean FROM public.brand_settings bs WHERE bs.brand_id = p_brand_id),
      false
    )
    WHEN p_key = 'kits' THEN public.brand_feature_enabled(p_brand_id, 'merchandise')
    WHEN p_key = 'batches' THEN COALESCE(
      (SELECT (bs.settings -> 'features' ->> 'batches')::boolean FROM public.brand_settings bs WHERE bs.brand_id = p_brand_id),
      false
    )
    WHEN p_key = 'competitions' THEN COALESCE(
      (SELECT (bs.settings -> 'features' ->> 'competitions')::boolean FROM public.brand_settings bs WHERE bs.brand_id = p_brand_id),
      false
    )
    ELSE COALESCE(
      (SELECT (bs.settings -> 'features' ->> p_key)::boolean FROM public.brand_settings bs WHERE bs.brand_id = p_brand_id),
      true
    )
  END;
$$;

CREATE OR REPLACE FUNCTION public.assert_competitions_enabled(p_brand_id uuid)
RETURNS void
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  IF NOT public.brand_feature_enabled(p_brand_id, 'competitions') THEN
    RAISE EXCEPTION 'feature_disabled';
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- brand_competitions: optional course/level filters
-- ---------------------------------------------------------------------------

ALTER TABLE public.brand_competitions
  ADD COLUMN IF NOT EXISTS program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS level_id uuid REFERENCES public.levels(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS brand_competitions_program_idx
  ON public.brand_competitions (brand_id, program_id);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.competition_question_bank (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  level_id uuid NOT NULL REFERENCES public.levels(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  explanation text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

DROP TRIGGER IF EXISTS competition_question_bank_audit ON public.competition_question_bank;
CREATE TRIGGER competition_question_bank_audit
  BEFORE INSERT OR UPDATE ON public.competition_question_bank
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE INDEX IF NOT EXISTS competition_question_bank_scope_idx
  ON public.competition_question_bank (brand_id, program_id, level_id);

CREATE TABLE IF NOT EXISTS public.competition_question_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.competition_question_bank(id) ON DELETE CASCADE,
  option_text text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

DROP TRIGGER IF EXISTS competition_question_options_audit ON public.competition_question_options;
CREATE TRIGGER competition_question_options_audit
  BEFORE INSERT OR UPDATE ON public.competition_question_options
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE INDEX IF NOT EXISTS competition_question_options_question_idx
  ON public.competition_question_options (question_id, sort_order);

CREATE TABLE IF NOT EXISTS public.brand_competition_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  competition_id uuid NOT NULL REFERENCES public.brand_competitions(id) ON DELETE CASCADE,
  bank_question_id uuid REFERENCES public.competition_question_bank(id) ON DELETE SET NULL,
  sort_order int NOT NULL DEFAULT 0,
  prompt text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_option_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

DROP TRIGGER IF EXISTS brand_competition_questions_audit ON public.brand_competition_questions;
CREATE TRIGGER brand_competition_questions_audit
  BEFORE INSERT OR UPDATE ON public.brand_competition_questions
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE UNIQUE INDEX IF NOT EXISTS brand_competition_questions_bank_uniq
  ON public.brand_competition_questions (competition_id, bank_question_id)
  WHERE bank_question_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS brand_competition_questions_comp_idx
  ON public.brand_competition_questions (competition_id, sort_order);

CREATE TABLE IF NOT EXISTS public.student_competition_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  center_id uuid NOT NULL REFERENCES public.franchise_centers(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES public.student_enrollments(id) ON DELETE SET NULL,
  competition_id uuid NOT NULL REFERENCES public.brand_competitions(id) ON DELETE CASCADE,
  registration_id uuid REFERENCES public.student_competition_registrations(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted')),
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  score numeric(10, 2),
  max_score int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE (student_id, competition_id)
);

DROP TRIGGER IF EXISTS student_competition_attempts_audit ON public.student_competition_attempts;
CREATE TRIGGER student_competition_attempts_audit
  BEFORE INSERT OR UPDATE ON public.student_competition_attempts
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE TABLE IF NOT EXISTS public.student_competition_attempt_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  attempt_id uuid NOT NULL REFERENCES public.student_competition_attempts(id) ON DELETE CASCADE,
  competition_question_id uuid NOT NULL REFERENCES public.brand_competition_questions(id) ON DELETE CASCADE,
  selected_option_ids uuid[] NOT NULL DEFAULT '{}',
  is_correct boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE (attempt_id, competition_question_id)
);

DROP TRIGGER IF EXISTS student_competition_attempt_answers_audit ON public.student_competition_attempt_answers;
CREATE TRIGGER student_competition_attempt_answers_audit
  BEFORE INSERT OR UPDATE ON public.student_competition_attempt_answers
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.competition_question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_competition_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_competition_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_competition_attempt_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS competition_question_bank_access ON public.competition_question_bank;
CREATE POLICY competition_question_bank_access ON public.competition_question_bank FOR ALL TO authenticated
  USING (
    (public.has_brand_access(brand_id) OR public.is_platform_admin())
    AND public.brand_feature_enabled(brand_id, 'competitions')
  )
  WITH CHECK (
    (public.has_brand_access(brand_id) OR public.is_platform_admin())
    AND public.brand_feature_enabled(brand_id, 'competitions')
  );

DROP POLICY IF EXISTS competition_question_options_access ON public.competition_question_options;
CREATE POLICY competition_question_options_access ON public.competition_question_options FOR ALL TO authenticated
  USING (
    (public.has_brand_access(brand_id) OR public.is_platform_admin())
    AND public.brand_feature_enabled(brand_id, 'competitions')
  )
  WITH CHECK (
    (public.has_brand_access(brand_id) OR public.is_platform_admin())
    AND public.brand_feature_enabled(brand_id, 'competitions')
  );

-- Snapshots: brand/platform only (students use RPCs so correct_option_ids stay hidden)
DROP POLICY IF EXISTS brand_competition_questions_access ON public.brand_competition_questions;
CREATE POLICY brand_competition_questions_access ON public.brand_competition_questions FOR ALL TO authenticated
  USING (
    (public.has_brand_access(brand_id) OR public.is_platform_admin())
    AND public.brand_feature_enabled(brand_id, 'competitions')
  )
  WITH CHECK (
    (public.has_brand_access(brand_id) OR public.is_platform_admin())
    AND public.brand_feature_enabled(brand_id, 'competitions')
  );

DROP POLICY IF EXISTS student_competition_attempts_access ON public.student_competition_attempts;
CREATE POLICY student_competition_attempts_access ON public.student_competition_attempts FOR SELECT TO authenticated
  USING (
    public.brand_feature_enabled(brand_id, 'competitions')
    AND (
      public.has_brand_access(brand_id)
      OR public.is_platform_admin()
      OR public.has_center_access(center_id)
      OR public.is_student_self(student_id, brand_id)
    )
  );

DROP POLICY IF EXISTS student_competition_attempt_answers_staff ON public.student_competition_attempt_answers;
CREATE POLICY student_competition_attempt_answers_staff ON public.student_competition_attempt_answers FOR SELECT TO authenticated
  USING (
    public.brand_feature_enabled(brand_id, 'competitions')
    AND (public.has_brand_access(brand_id) OR public.is_platform_admin())
  );

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.uuid_arrays_equal(p_a uuid[], p_b uuid[])
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT array_agg(x ORDER BY x) FROM unnest(COALESCE(p_a, '{}'::uuid[])) AS t(x)),
    '{}'::uuid[]
  ) = COALESCE(
    (SELECT array_agg(x ORDER BY x) FROM unnest(COALESCE(p_b, '{}'::uuid[])) AS t(x)),
    '{}'::uuid[]
  );
$$;

CREATE OR REPLACE FUNCTION public.competition_questions_locked(p_competition_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.student_competition_attempts a
    WHERE a.competition_id = p_competition_id
  );
$$;

CREATE OR REPLACE FUNCTION public.snapshot_bank_question_onto_competition(
  p_competition_id uuid,
  p_bank_question_id uuid,
  p_sort_order int
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_q public.competition_question_bank%ROWTYPE;
  v_options jsonb;
  v_correct uuid[];
  v_id uuid;
BEGIN
  SELECT * INTO v_q FROM public.competition_question_bank WHERE id = p_bank_question_id;
  IF v_q.id IS NULL THEN
    RAISE EXCEPTION 'Question not found';
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('id', o.id, 'text', o.option_text) ORDER BY o.sort_order), '[]'::jsonb),
         COALESCE(array_agg(o.id ORDER BY o.sort_order) FILTER (WHERE o.is_correct), '{}'::uuid[])
  INTO v_options, v_correct
  FROM public.competition_question_options o
  WHERE o.question_id = p_bank_question_id;

  INSERT INTO public.brand_competition_questions (
    brand_id, competition_id, bank_question_id, sort_order, prompt, options, correct_option_ids
  )
  VALUES (
    v_q.brand_id, p_competition_id, p_bank_question_id, p_sort_order, v_q.prompt, v_options, v_correct
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Retarget existing competition RPCs onto competitions flag
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.upsert_brand_competition(uuid, text, date, text, boolean, uuid, text, numeric, text, timestamptz, timestamptz, text, int, jsonb);

CREATE OR REPLACE FUNCTION public.upsert_brand_competition(
  p_brand_id uuid,
  p_name text,
  p_event_date date DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_is_active boolean DEFAULT true,
  p_id uuid DEFAULT NULL,
  p_fee_type text DEFAULT 'free',
  p_fee_amount numeric DEFAULT NULL,
  p_fee_currency text DEFAULT 'INR',
  p_registration_opens_at timestamptz DEFAULT NULL,
  p_registration_closes_at timestamptz DEFAULT NULL,
  p_registration_mode text DEFAULT 'open',
  p_max_participants int DEFAULT NULL,
  p_eligibility_rules jsonb DEFAULT '{"requires_active_enrollment": true}'::jsonb,
  p_program_id uuid DEFAULT NULL,
  p_level_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT public.has_brand_access(p_brand_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  PERFORM public.assert_competitions_enabled(p_brand_id);
  IF trim(coalesce(p_name, '')) = '' THEN
    RAISE EXCEPTION 'name is required';
  END IF;
  IF coalesce(p_fee_type, 'free') NOT IN ('free', 'paid') THEN
    RAISE EXCEPTION 'Invalid fee_type';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.brand_competitions (
      brand_id, name, event_date, location, is_active, fee_type, fee_amount, fee_currency,
      registration_opens_at, registration_closes_at, registration_mode, max_participants, eligibility_rules,
      program_id, level_id
    )
    VALUES (
      p_brand_id, trim(p_name), p_event_date, nullif(trim(coalesce(p_location, '')), ''),
      coalesce(p_is_active, true), coalesce(p_fee_type, 'free'), p_fee_amount,
      coalesce(p_fee_currency, 'INR'), p_registration_opens_at, p_registration_closes_at,
      coalesce(p_registration_mode, 'open'), p_max_participants,
      coalesce(p_eligibility_rules, '{"requires_active_enrollment": true}'::jsonb),
      p_program_id, p_level_id
    )
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.brand_competitions
    SET name = trim(p_name),
        event_date = p_event_date,
        location = nullif(trim(coalesce(p_location, '')), ''),
        is_active = coalesce(p_is_active, true),
        fee_type = coalesce(p_fee_type, fee_type),
        fee_amount = p_fee_amount,
        fee_currency = coalesce(p_fee_currency, fee_currency),
        registration_opens_at = p_registration_opens_at,
        registration_closes_at = p_registration_closes_at,
        registration_mode = coalesce(p_registration_mode, registration_mode),
        max_participants = p_max_participants,
        eligibility_rules = coalesce(p_eligibility_rules, eligibility_rules),
        program_id = p_program_id,
        level_id = p_level_id,
        updated_at = now()
    WHERE id = p_id AND brand_id = p_brand_id
    RETURNING id INTO v_id;
    IF v_id IS NULL THEN RAISE EXCEPTION 'Competition not found'; END IF;
  END IF;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_brand_competition(p_brand_id uuid, p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_brand_access(p_brand_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  PERFORM public.assert_competitions_enabled(p_brand_id);

  DELETE FROM public.brand_competitions WHERE id = p_id AND brand_id = p_brand_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Competition not found';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.register_student_for_competition(p_competition_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id uuid;
  v_brand_id uuid;
  v_enrollment public.student_enrollments%ROWTYPE;
  v_comp public.brand_competitions%ROWTYPE;
  v_count int;
  v_status text;
  v_id uuid;
  v_now timestamptz := now();
BEGIN
  SELECT bc.* INTO v_comp FROM public.brand_competitions bc WHERE bc.id = p_competition_id;
  IF v_comp.id IS NULL OR NOT v_comp.is_active THEN
    RAISE EXCEPTION 'Competition not found';
  END IF;

  v_brand_id := v_comp.brand_id;
  PERFORM public.assert_competitions_enabled(v_brand_id);
  v_student_id := public.resolve_student_for_learn(v_brand_id);
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'NO_STUDENT_LINK';
  END IF;

  v_enrollment := public.get_student_active_enrollment(v_student_id, v_brand_id);

  IF v_comp.fee_type = 'paid' THEN
    RAISE EXCEPTION 'PAID_ENROLLMENT_NOT_AVAILABLE';
  END IF;
  IF v_comp.registration_mode <> 'open' THEN
    RAISE EXCEPTION 'REGISTRATION_CLOSED';
  END IF;
  IF v_comp.registration_opens_at IS NOT NULL AND v_now < v_comp.registration_opens_at THEN
    RAISE EXCEPTION 'REGISTRATION_CLOSED';
  END IF;
  IF v_comp.registration_closes_at IS NOT NULL AND v_now > v_comp.registration_closes_at THEN
    RAISE EXCEPTION 'REGISTRATION_CLOSED';
  END IF;

  IF v_comp.max_participants IS NOT NULL THEN
    SELECT count(*)::int INTO v_count
    FROM public.student_competition_registrations r
    WHERE r.competition_id = p_competition_id AND r.status IN ('registered', 'confirmed', 'waitlisted');
    IF v_count >= v_comp.max_participants THEN
      v_status := 'waitlisted';
    ELSE
      v_status := 'registered';
    END IF;
  ELSE
    v_status := 'registered';
  END IF;

  INSERT INTO public.student_competition_registrations (
    brand_id, center_id, student_id, enrollment_id, competition_id, status, registered_by
  )
  VALUES (
    v_brand_id, v_enrollment.center_id, v_student_id, v_enrollment.id, p_competition_id,
    v_status, auth.uid()
  )
  ON CONFLICT (student_id, competition_id) DO UPDATE
  SET status = CASE
        WHEN student_competition_registrations.status = 'withdrawn' THEN EXCLUDED.status
        ELSE student_competition_registrations.status
      END,
      enrollment_id = EXCLUDED.enrollment_id,
      center_id = EXCLUDED.center_id,
      updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.withdraw_competition_registration(p_registration_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reg public.student_competition_registrations%ROWTYPE;
BEGIN
  SELECT * INTO v_reg FROM public.student_competition_registrations WHERE id = p_registration_id;
  IF v_reg.id IS NULL THEN
    RAISE EXCEPTION 'Registration not found';
  END IF;
  PERFORM public.assert_competitions_enabled(v_reg.brand_id);
  IF NOT public.is_student_self(v_reg.student_id, v_reg.brand_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.student_competition_registrations
  SET status = 'withdrawn', updated_at = now()
  WHERE id = p_registration_id;
END;
$$;

-- Wrap learn home so competition arrays empty when flag off (keep 055 payload).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_student_learn_home'
      AND NOT EXISTS (
        SELECT 1 FROM pg_proc p2
        JOIN pg_namespace n2 ON n2.oid = p2.pronamespace
        WHERE n2.nspname = 'public' AND p2.proname = '_get_student_learn_home_base'
      )
  ) THEN
    ALTER FUNCTION public.get_student_learn_home(uuid) RENAME TO _get_student_learn_home_base;
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.get_student_learn_home(p_brand_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  v_result := public._get_student_learn_home_base(p_brand_id);
  IF NOT public.brand_feature_enabled(p_brand_id, 'competitions') THEN
    v_result := v_result || jsonb_build_object(
      'upcoming_competitions', '[]'::jsonb,
      'my_registrations', '[]'::jsonb,
      'recent_results', '[]'::jsonb
    );
    v_result := jsonb_set(v_result, '{stats,competitions_registered}', '0'::jsonb);
    v_result := jsonb_set(v_result, '{stats,competitions_completed}', '0'::jsonb);
    v_result := jsonb_set(
      v_result,
      '{quick_actions}',
      COALESCE((
        SELECT jsonb_agg(elem)
        FROM jsonb_array_elements(COALESCE(v_result->'quick_actions', '[]'::jsonb)) elem
        WHERE elem->>'href' IS DISTINCT FROM '/competitions'
      ), '[]'::jsonb)
    );
    v_result := jsonb_set(
      v_result,
      '{recent_activity}',
      COALESCE((
        SELECT jsonb_agg(elem)
        FROM jsonb_array_elements(COALESCE(v_result->'recent_activity', '[]'::jsonb)) elem
        WHERE elem->>'type' NOT IN ('competition_registration', 'competition_result')
      ), '[]'::jsonb)
    );
  END IF;
  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public._get_student_learn_home_base(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_learn_home(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Bank RPCs
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.upsert_competition_bank_question(
  p_brand_id uuid,
  p_program_id uuid,
  p_level_id uuid,
  p_prompt text,
  p_options jsonb,
  p_id uuid DEFAULT NULL,
  p_explanation text DEFAULT NULL,
  p_is_active boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_opt jsonb;
  v_count int := 0;
  v_correct int := 0;
  v_sort int := 0;
  v_level_program uuid;
BEGIN
  IF NOT public.has_brand_access(p_brand_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  PERFORM public.assert_competitions_enabled(p_brand_id);
  IF trim(coalesce(p_prompt, '')) = '' THEN
    RAISE EXCEPTION 'prompt is required';
  END IF;

  SELECT l.program_id INTO v_level_program
  FROM public.levels l
  WHERE l.id = p_level_id AND l.brand_id = p_brand_id;
  IF v_level_program IS NULL OR v_level_program IS DISTINCT FROM p_program_id THEN
    RAISE EXCEPTION 'Level does not belong to course';
  END IF;

  IF jsonb_typeof(p_options) <> 'array' THEN
    RAISE EXCEPTION 'options must be an array';
  END IF;
  v_count := jsonb_array_length(p_options);
  IF v_count < 2 OR v_count > 6 THEN
    RAISE EXCEPTION 'Question must have 2 to 6 options';
  END IF;

  FOR v_opt IN SELECT * FROM jsonb_array_elements(p_options)
  LOOP
    IF trim(coalesce(v_opt->>'text', '')) = '' THEN
      RAISE EXCEPTION 'Each option needs text';
    END IF;
    IF COALESCE((v_opt->>'is_correct')::boolean, false) THEN
      v_correct := v_correct + 1;
    END IF;
  END LOOP;
  IF v_correct < 1 THEN
    RAISE EXCEPTION 'At least one correct answer is required';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.competition_question_bank (
      brand_id, program_id, level_id, prompt, explanation, is_active
    )
    VALUES (
      p_brand_id, p_program_id, p_level_id, trim(p_prompt), nullif(trim(coalesce(p_explanation, '')), ''),
      coalesce(p_is_active, true)
    )
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.competition_question_bank
    SET program_id = p_program_id,
        level_id = p_level_id,
        prompt = trim(p_prompt),
        explanation = nullif(trim(coalesce(p_explanation, '')), ''),
        is_active = coalesce(p_is_active, true),
        updated_at = now()
    WHERE id = p_id AND brand_id = p_brand_id
    RETURNING id INTO v_id;
    IF v_id IS NULL THEN RAISE EXCEPTION 'Question not found'; END IF;
    DELETE FROM public.competition_question_options WHERE question_id = v_id;
  END IF;

  v_sort := 0;
  FOR v_opt IN SELECT * FROM jsonb_array_elements(p_options)
  LOOP
    INSERT INTO public.competition_question_options (
      brand_id, question_id, option_text, is_correct, sort_order
    )
    VALUES (
      p_brand_id, v_id, trim(v_opt->>'text'), COALESCE((v_opt->>'is_correct')::boolean, false), v_sort
    );
    v_sort := v_sort + 1;
  END LOOP;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_competition_bank_question(p_brand_id uuid, p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_brand_access(p_brand_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  PERFORM public.assert_competitions_enabled(p_brand_id);
  DELETE FROM public.competition_question_bank WHERE id = p_id AND brand_id = p_brand_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Question not found';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_competition_bank_questions(
  p_brand_id uuid,
  p_program_id uuid DEFAULT NULL,
  p_level_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_brand_access(p_brand_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  PERFORM public.assert_competitions_enabled(p_brand_id);

  RETURN COALESCE((
    SELECT jsonb_agg(q ORDER BY q->>'prompt')
    FROM (
      SELECT jsonb_build_object(
        'id', b.id,
        'program_id', b.program_id,
        'level_id', b.level_id,
        'prompt', b.prompt,
        'explanation', b.explanation,
        'is_active', b.is_active,
        'options', COALESCE((
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', o.id,
              'text', o.option_text,
              'is_correct', o.is_correct,
              'sort_order', o.sort_order
            ) ORDER BY o.sort_order
          )
          FROM public.competition_question_options o
          WHERE o.question_id = b.id
        ), '[]'::jsonb)
      ) AS q
      FROM public.competition_question_bank b
      WHERE b.brand_id = p_brand_id
        AND (p_program_id IS NULL OR b.program_id = p_program_id)
        AND (p_level_id IS NULL OR b.level_id = p_level_id)
    ) rows
  ), '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.list_brand_competition_questions(p_brand_id uuid, p_competition_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_brand_access(p_brand_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  PERFORM public.assert_competitions_enabled(p_brand_id);

  RETURN COALESCE((
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', q.id,
        'bank_question_id', q.bank_question_id,
        'sort_order', q.sort_order,
        'prompt', q.prompt,
        'options', q.options,
        'correct_option_ids', to_jsonb(q.correct_option_ids)
      ) ORDER BY q.sort_order
    )
    FROM public.brand_competition_questions q
    WHERE q.brand_id = p_brand_id AND q.competition_id = p_competition_id
  ), '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.set_brand_competition_questions(
  p_brand_id uuid,
  p_competition_id uuid,
  p_bank_question_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_comp public.brand_competitions%ROWTYPE;
  v_qid uuid;
  v_sort int := 0;
BEGIN
  IF NOT public.has_brand_access(p_brand_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  PERFORM public.assert_competitions_enabled(p_brand_id);

  SELECT * INTO v_comp FROM public.brand_competitions
  WHERE id = p_competition_id AND brand_id = p_brand_id;
  IF v_comp.id IS NULL THEN RAISE EXCEPTION 'Competition not found'; END IF;

  IF public.competition_questions_locked(p_competition_id) THEN
    RAISE EXCEPTION 'QUESTIONS_LOCKED';
  END IF;

  DELETE FROM public.brand_competition_questions
  WHERE competition_id = p_competition_id AND brand_id = p_brand_id;

  IF p_bank_question_ids IS NULL THEN
    RETURN;
  END IF;

  FOREACH v_qid IN ARRAY p_bank_question_ids
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.competition_question_bank b
      WHERE b.id = v_qid AND b.brand_id = p_brand_id AND b.is_active
    ) THEN
      RAISE EXCEPTION 'Question not found';
    END IF;
    PERFORM public.snapshot_bank_question_onto_competition(p_competition_id, v_qid, v_sort);
    v_sort := v_sort + 1;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_random_competition_questions(
  p_brand_id uuid,
  p_competition_id uuid,
  p_program_id uuid,
  p_level_id uuid,
  p_count int
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_comp public.brand_competitions%ROWTYPE;
  v_qid uuid;
  v_sort int;
  v_added int := 0;
BEGIN
  IF NOT public.has_brand_access(p_brand_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  PERFORM public.assert_competitions_enabled(p_brand_id);
  IF p_count IS NULL OR p_count < 1 THEN
    RAISE EXCEPTION 'count must be at least 1';
  END IF;

  SELECT * INTO v_comp FROM public.brand_competitions
  WHERE id = p_competition_id AND brand_id = p_brand_id;
  IF v_comp.id IS NULL THEN RAISE EXCEPTION 'Competition not found'; END IF;

  IF public.competition_questions_locked(p_competition_id) THEN
    RAISE EXCEPTION 'QUESTIONS_LOCKED';
  END IF;

  SELECT COALESCE(max(sort_order), -1) + 1 INTO v_sort
  FROM public.brand_competition_questions
  WHERE competition_id = p_competition_id;

  FOR v_qid IN
    SELECT b.id
    FROM public.competition_question_bank b
    WHERE b.brand_id = p_brand_id
      AND b.program_id = p_program_id
      AND b.level_id = p_level_id
      AND b.is_active
      AND NOT EXISTS (
        SELECT 1 FROM public.brand_competition_questions q
        WHERE q.competition_id = p_competition_id AND q.bank_question_id = b.id
      )
    ORDER BY random()
    LIMIT p_count
  LOOP
    PERFORM public.snapshot_bank_question_onto_competition(p_competition_id, v_qid, v_sort);
    v_sort := v_sort + 1;
    v_added := v_added + 1;
  END LOOP;

  RETURN v_added;
END;
$$;

-- ---------------------------------------------------------------------------
-- Student quiz RPCs
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.competition_quiz_meta_for_student(
  p_competition_id uuid,
  p_student_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_comp public.brand_competitions%ROWTYPE;
  v_qcount int := 0;
  v_attempt public.student_competition_attempts%ROWTYPE;
  v_reg_status text;
  v_today date := (now() AT TIME ZONE 'Asia/Kolkata')::date;
  v_status text;
  v_can_take boolean := false;
BEGIN
  SELECT * INTO v_comp FROM public.brand_competitions WHERE id = p_competition_id;
  SELECT count(*)::int INTO v_qcount
  FROM public.brand_competition_questions q WHERE q.competition_id = p_competition_id;
  SELECT * INTO v_attempt
  FROM public.student_competition_attempts a
  WHERE a.competition_id = p_competition_id AND a.student_id = p_student_id;
  SELECT r.status INTO v_reg_status
  FROM public.student_competition_registrations r
  WHERE r.competition_id = p_competition_id AND r.student_id = p_student_id;

  IF v_qcount = 0 THEN
    v_status := 'none';
  ELSIF v_attempt.status = 'submitted' THEN
    v_status := 'submitted';
  ELSIF v_attempt.status = 'in_progress' THEN
    v_status := 'in_progress';
  ELSIF v_comp.event_date IS NOT NULL AND v_comp.event_date > v_today THEN
    v_status := 'not_open';
  ELSIF NOT coalesce(v_comp.is_active, false) THEN
    v_status := 'inactive';
  ELSE
    v_status := 'available';
  END IF;

  v_can_take := v_qcount > 0
    AND coalesce(v_reg_status, '') IN ('registered', 'confirmed')
    AND v_status IN ('available', 'in_progress');

  RETURN jsonb_build_object(
    'question_count', v_qcount,
    'quiz_status', v_status,
    'can_take', v_can_take,
    'score', v_attempt.score,
    'max_score', v_attempt.max_score
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_student_competitions(p_brand_id uuid, p_filter text DEFAULT 'upcoming')
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id uuid;
  v_home jsonb;
BEGIN
  IF NOT public.brand_feature_enabled(p_brand_id, 'competitions') THEN
    RETURN '[]'::jsonb;
  END IF;

  v_student_id := public.resolve_student_for_learn(p_brand_id);
  IF v_student_id IS NULL THEN RAISE EXCEPTION 'NO_STUDENT_LINK'; END IF;
  PERFORM public.get_student_active_enrollment(v_student_id, p_brand_id);

  IF p_filter = 'registered' THEN
    RETURN COALESCE((
      SELECT jsonb_agg(row.item ORDER BY (row.item->>'event_date') ASC NULLS LAST)
      FROM (
        SELECT jsonb_build_object(
          'registration_id', r.id,
          'competition_id', bc.id,
          'name', bc.name,
          'event_date', bc.event_date,
          'location', bc.location,
          'status', r.status,
          'fee_type', bc.fee_type,
          'fee_amount', bc.fee_amount
        ) || public.competition_quiz_meta_for_student(bc.id, v_student_id) AS item
        FROM public.student_competition_registrations r
        JOIN public.brand_competitions bc ON bc.id = r.competition_id
        WHERE r.student_id = v_student_id AND r.status IN ('registered', 'confirmed', 'waitlisted')
      ) row
    ), '[]'::jsonb);
  ELSIF p_filter = 'past' THEN
    RETURN COALESCE((
      SELECT jsonb_agg(row.item ORDER BY (row.item->>'event_date') DESC NULLS LAST)
      FROM (
        SELECT jsonb_build_object(
          'competition_id', bc.id,
          'name', bc.name,
          'event_date', bc.event_date,
          'result_rank', sce.result_rank,
          'rank_position', sce.rank_position,
          'score', sce.score
        ) || public.competition_quiz_meta_for_student(bc.id, v_student_id) AS item
        FROM public.student_competition_entries sce
        JOIN public.brand_competitions bc ON bc.id = sce.competition_id
        WHERE sce.student_id = v_student_id
      ) row
    ), '[]'::jsonb);
  ELSE
    v_home := public.get_student_learn_home(p_brand_id);
    RETURN COALESCE((
      SELECT jsonb_agg(elem || public.competition_quiz_meta_for_student((elem->>'id')::uuid, v_student_id))
      FROM jsonb_array_elements(COALESCE(v_home->'upcoming_competitions', '[]'::jsonb)) elem
    ), '[]'::jsonb);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_student_competition_quiz(p_competition_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_comp public.brand_competitions%ROWTYPE;
  v_student_id uuid;
  v_attempt public.student_competition_attempts%ROWTYPE;
  v_questions jsonb;
  v_review jsonb := '[]'::jsonb;
BEGIN
  SELECT * INTO v_comp FROM public.brand_competitions WHERE id = p_competition_id;
  IF v_comp.id IS NULL THEN RAISE EXCEPTION 'Competition not found'; END IF;
  PERFORM public.assert_competitions_enabled(v_comp.brand_id);

  v_student_id := public.resolve_student_for_learn(v_comp.brand_id);
  IF v_student_id IS NULL THEN RAISE EXCEPTION 'NO_STUDENT_LINK'; END IF;
  PERFORM public.get_student_active_enrollment(v_student_id, v_comp.brand_id);

  SELECT * INTO v_attempt
  FROM public.student_competition_attempts
  WHERE competition_id = p_competition_id AND student_id = v_student_id;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', q.id,
      'sort_order', q.sort_order,
      'prompt', q.prompt,
      'options', q.options
    ) ORDER BY q.sort_order
  ), '[]'::jsonb)
  INTO v_questions
  FROM public.brand_competition_questions q
  WHERE q.competition_id = p_competition_id;

  IF v_attempt.status = 'submitted' THEN
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'competition_question_id', a.competition_question_id,
        'selected_option_ids', to_jsonb(a.selected_option_ids),
        'is_correct', a.is_correct,
        'correct_option_ids', to_jsonb(q.correct_option_ids),
        'explanation', b.explanation
      )
    ), '[]'::jsonb)
    INTO v_review
    FROM public.student_competition_attempt_answers a
    JOIN public.brand_competition_questions q ON q.id = a.competition_question_id
    LEFT JOIN public.competition_question_bank b ON b.id = q.bank_question_id
    WHERE a.attempt_id = v_attempt.id;
  END IF;

  RETURN jsonb_build_object(
    'competition_id', v_comp.id,
    'name', v_comp.name,
    'questions', v_questions,
    'attempt_status', coalesce(v_attempt.status, 'none'),
    'score', v_attempt.score,
    'max_score', v_attempt.max_score,
    'review', CASE WHEN v_attempt.status = 'submitted' THEN v_review ELSE '[]'::jsonb END
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.start_competition_attempt(p_competition_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_comp public.brand_competitions%ROWTYPE;
  v_student_id uuid;
  v_enrollment public.student_enrollments%ROWTYPE;
  v_reg public.student_competition_registrations%ROWTYPE;
  v_attempt public.student_competition_attempts%ROWTYPE;
  v_qcount int;
  v_today date := (now() AT TIME ZONE 'Asia/Kolkata')::date;
  v_id uuid;
BEGIN
  SELECT * INTO v_comp FROM public.brand_competitions WHERE id = p_competition_id;
  IF v_comp.id IS NULL OR NOT v_comp.is_active THEN
    RAISE EXCEPTION 'Competition not found';
  END IF;
  PERFORM public.assert_competitions_enabled(v_comp.brand_id);

  v_student_id := public.resolve_student_for_learn(v_comp.brand_id);
  IF v_student_id IS NULL THEN RAISE EXCEPTION 'NO_STUDENT_LINK'; END IF;
  v_enrollment := public.get_student_active_enrollment(v_student_id, v_comp.brand_id);

  SELECT * INTO v_reg
  FROM public.student_competition_registrations r
  WHERE r.competition_id = p_competition_id AND r.student_id = v_student_id
    AND r.status IN ('registered', 'confirmed');
  IF v_reg.id IS NULL THEN
    RAISE EXCEPTION 'NOT_REGISTERED';
  END IF;

  SELECT count(*)::int INTO v_qcount
  FROM public.brand_competition_questions WHERE competition_id = p_competition_id;
  IF v_qcount < 1 THEN
    RAISE EXCEPTION 'NO_QUESTIONS';
  END IF;
  IF v_comp.event_date IS NOT NULL AND v_comp.event_date > v_today THEN
    RAISE EXCEPTION 'QUIZ_NOT_OPEN';
  END IF;

  SELECT * INTO v_attempt
  FROM public.student_competition_attempts
  WHERE student_id = v_student_id AND competition_id = p_competition_id;

  IF v_attempt.status = 'submitted' THEN
    RAISE EXCEPTION 'ALREADY_SUBMITTED';
  END IF;
  IF v_attempt.id IS NOT NULL THEN
    RETURN v_attempt.id;
  END IF;

  INSERT INTO public.student_competition_attempts (
    brand_id, center_id, student_id, enrollment_id, competition_id, registration_id, status
  )
  VALUES (
    v_comp.brand_id, v_enrollment.center_id, v_student_id, v_enrollment.id,
    p_competition_id, v_reg.id, 'in_progress'
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_competition_attempt(
  p_competition_id uuid,
  p_answers jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_comp public.brand_competitions%ROWTYPE;
  v_student_id uuid;
  v_attempt public.student_competition_attempts%ROWTYPE;
  v_q public.brand_competition_questions%ROWTYPE;
  v_ans jsonb;
  v_selected uuid[];
  v_correct_count int := 0;
  v_max int := 0;
  v_ok boolean;
BEGIN
  SELECT * INTO v_comp FROM public.brand_competitions WHERE id = p_competition_id;
  IF v_comp.id IS NULL THEN RAISE EXCEPTION 'Competition not found'; END IF;
  PERFORM public.assert_competitions_enabled(v_comp.brand_id);

  v_student_id := public.resolve_student_for_learn(v_comp.brand_id);
  IF v_student_id IS NULL THEN RAISE EXCEPTION 'NO_STUDENT_LINK'; END IF;

  SELECT * INTO v_attempt
  FROM public.student_competition_attempts
  WHERE student_id = v_student_id AND competition_id = p_competition_id;
  IF v_attempt.id IS NULL THEN
    PERFORM public.start_competition_attempt(p_competition_id);
    SELECT * INTO v_attempt
    FROM public.student_competition_attempts
    WHERE student_id = v_student_id AND competition_id = p_competition_id;
  END IF;
  IF v_attempt.status = 'submitted' THEN
    RAISE EXCEPTION 'ALREADY_SUBMITTED';
  END IF;

  DELETE FROM public.student_competition_attempt_answers WHERE attempt_id = v_attempt.id;

  FOR v_q IN
    SELECT * FROM public.brand_competition_questions
    WHERE competition_id = p_competition_id
    ORDER BY sort_order
  LOOP
    v_max := v_max + 1;
    v_selected := '{}'::uuid[];
    SELECT COALESCE(ARRAY(
      SELECT jsonb_array_elements_text(COALESCE(elem->'selected_option_ids', '[]'::jsonb))::uuid
      FROM jsonb_array_elements(COALESCE(p_answers, '[]'::jsonb)) elem
      WHERE (elem->>'competition_question_id')::uuid = v_q.id
    ), '{}'::uuid[]) INTO v_selected;

    v_ok := public.uuid_arrays_equal(v_selected, v_q.correct_option_ids);
    IF v_ok THEN
      v_correct_count := v_correct_count + 1;
    END IF;

    INSERT INTO public.student_competition_attempt_answers (
      brand_id, attempt_id, competition_question_id, selected_option_ids, is_correct
    )
    VALUES (
      v_comp.brand_id, v_attempt.id, v_q.id, COALESCE(v_selected, '{}'::uuid[]), v_ok
    );
  END LOOP;

  UPDATE public.student_competition_attempts
  SET status = 'submitted',
      submitted_at = now(),
      score = v_correct_count,
      max_score = v_max,
      updated_at = now()
  WHERE id = v_attempt.id;

  INSERT INTO public.student_competition_entries (
    brand_id, center_id, student_id, enrollment_id, competition_id, score
  )
  VALUES (
    v_comp.brand_id, v_attempt.center_id, v_student_id, v_attempt.enrollment_id, p_competition_id, v_correct_count
  )
  ON CONFLICT (student_id, competition_id) DO UPDATE
  SET score = EXCLUDED.score,
      enrollment_id = coalesce(EXCLUDED.enrollment_id, student_competition_entries.enrollment_id),
      updated_at = now();

  RETURN jsonb_build_object('score', v_correct_count, 'max_score', v_max, 'attempt_id', v_attempt.id);
END;
$$;

-- Grants
REVOKE ALL ON FUNCTION public.assert_competitions_enabled(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assert_competitions_enabled(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.upsert_brand_competition(uuid, text, date, text, boolean, uuid, text, numeric, text, timestamptz, timestamptz, text, int, jsonb, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_brand_competition(uuid, text, date, text, boolean, uuid, text, numeric, text, timestamptz, timestamptz, text, int, jsonb, uuid, uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.delete_brand_competition(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_brand_competition(uuid, uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.register_student_for_competition(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_student_for_competition(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.withdraw_competition_registration(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.withdraw_competition_registration(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.get_student_competitions(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_student_competitions(uuid, text) TO authenticated;
REVOKE ALL ON FUNCTION public.upsert_competition_bank_question(uuid, uuid, uuid, text, jsonb, uuid, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_competition_bank_question(uuid, uuid, uuid, text, jsonb, uuid, text, boolean) TO authenticated;
REVOKE ALL ON FUNCTION public.delete_competition_bank_question(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_competition_bank_question(uuid, uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.list_competition_bank_questions(uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_competition_bank_questions(uuid, uuid, uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.list_brand_competition_questions(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_brand_competition_questions(uuid, uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.set_brand_competition_questions(uuid, uuid, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_brand_competition_questions(uuid, uuid, uuid[]) TO authenticated;
REVOKE ALL ON FUNCTION public.add_random_competition_questions(uuid, uuid, uuid, uuid, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_random_competition_questions(uuid, uuid, uuid, uuid, int) TO authenticated;
REVOKE ALL ON FUNCTION public.get_student_competition_quiz(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_student_competition_quiz(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.start_competition_attempt(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_competition_attempt(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.submit_competition_attempt(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_competition_attempt(uuid, jsonb) TO authenticated;
REVOKE ALL ON FUNCTION public.snapshot_bank_question_onto_competition(uuid, uuid, int) FROM PUBLIC, anon, authenticated;

NOTIFY pgrst, 'reload schema';
