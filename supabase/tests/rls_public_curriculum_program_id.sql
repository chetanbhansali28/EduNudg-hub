-- Public curriculum JSON includes programs.id for course URLs.

DO $$
DECLARE
  def text;
BEGIN
  IF to_regprocedure('public.brand_public_curriculum_json(uuid)') IS NULL THEN
    RAISE EXCEPTION 'brand_public_curriculum_json function is required';
  END IF;

  def := pg_get_functiondef('public.brand_public_curriculum_json(uuid)'::regprocedure);
  IF position('''id'', p.id' in def) = 0 THEN
    RAISE EXCEPTION 'brand_public_curriculum_json must include program id';
  END IF;
END;
$$;
