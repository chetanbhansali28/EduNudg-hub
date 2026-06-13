-- Brand curriculum: clone published version to draft; guard level deletion.

CREATE OR REPLACE FUNCTION public.clone_curriculum_version_to_draft(p_version_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_src public.curriculum_versions%ROWTYPE;
  v_new_id uuid;
  v_new_version int;
  v_level record;
  v_new_level_id uuid;
  v_mod record;
  v_new_mod_id uuid;
  v_lesson record;
BEGIN
  SELECT * INTO v_src FROM public.curriculum_versions WHERE id = p_version_id;
  IF v_src.id IS NULL THEN
    RAISE EXCEPTION 'Version not found';
  END IF;
  IF NOT public.has_brand_access(v_src.brand_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.curriculum_versions cv
    WHERE cv.program_id = v_src.program_id AND cv.status = 'draft'
  ) THEN
    RAISE EXCEPTION 'DRAFT_ALREADY_EXISTS';
  END IF;

  SELECT coalesce(max(version_number), 0) + 1 INTO v_new_version
  FROM public.curriculum_versions WHERE program_id = v_src.program_id;

  INSERT INTO public.curriculum_versions (
    program_id, brand_id, version_number, status
  )
  VALUES (v_src.program_id, v_src.brand_id, v_new_version, 'draft')
  RETURNING id INTO v_new_id;

  FOR v_level IN
    SELECT * FROM public.levels l WHERE l.curriculum_version_id = p_version_id ORDER BY l.sort_order
  LOOP
    INSERT INTO public.levels (
      curriculum_version_id, brand_id, name, sort_order, unlock_rules,
      abacus_level_code, topics_covered, why_take, what_you_learn, marketing_video_url
    )
    VALUES (
      v_new_id, v_level.brand_id, v_level.name, v_level.sort_order, v_level.unlock_rules,
      v_level.abacus_level_code, v_level.topics_covered, v_level.why_take,
      v_level.what_you_learn, v_level.marketing_video_url
    )
    RETURNING id INTO v_new_level_id;

    FOR v_mod IN
      SELECT * FROM public.modules m WHERE m.level_id = v_level.id ORDER BY m.sort_order
    LOOP
      INSERT INTO public.modules (level_id, brand_id, title, sort_order)
      VALUES (v_new_level_id, v_mod.brand_id, v_mod.title, v_mod.sort_order)
      RETURNING id INTO v_new_mod_id;

      FOR v_lesson IN
        SELECT * FROM public.lessons les WHERE les.module_id = v_mod.id ORDER BY les.sort_order
      LOOP
        INSERT INTO public.lessons (
          module_id, brand_id, title, content_type, duration_minutes, sort_order
        )
        VALUES (
          v_new_mod_id, v_lesson.brand_id, v_lesson.title, v_lesson.content_type,
          v_lesson.duration_minutes, v_lesson.sort_order
        );
      END LOOP;
    END LOOP;
  END LOOP;

  RETURN v_new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.clone_curriculum_version_to_draft(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.clone_curriculum_version_to_draft(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.assert_level_deletable(p_level_id uuid)
RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_id uuid;
BEGIN
  SELECT l.brand_id INTO v_brand_id FROM public.levels l WHERE l.id = p_level_id;
  IF v_brand_id IS NULL THEN
    RAISE EXCEPTION 'Level not found';
  END IF;
  IF NOT public.has_brand_access(v_brand_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.student_level_progress slp
    WHERE slp.level_id = p_level_id OR (
      slp.level_name IN (SELECT name FROM public.levels WHERE id = p_level_id)
      AND slp.brand_id = v_brand_id
    )
  ) THEN
    RAISE EXCEPTION 'LEVEL_HAS_STUDENT_PROGRESS';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.batches b
    WHERE b.deleted_at IS NULL
      AND (b.level_start_id = p_level_id OR b.level_end_id = p_level_id)
  ) THEN
    RAISE EXCEPTION 'LEVEL_USED_BY_BATCH';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.assert_level_deletable(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assert_level_deletable(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_curriculum_level(p_level_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.assert_level_deletable(p_level_id);
  DELETE FROM public.levels WHERE id = p_level_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_curriculum_level(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_curriculum_level(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
