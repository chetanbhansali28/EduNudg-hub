-- Learn portal read RPCs call resolve_student_for_learn, which may UPDATE students.user_id
-- on first login (email match). PostgREST runs STABLE functions in read-only transactions,
-- which rejects writes and surfaces HTTP 405 Method Not Allowed to the client.

ALTER FUNCTION public.resolve_student_for_learn(uuid) VOLATILE;
ALTER FUNCTION public.get_student_learn_home(uuid) VOLATILE;
ALTER FUNCTION public.get_student_progress_detail(uuid) VOLATILE;
ALTER FUNCTION public.get_student_competitions(uuid, text) VOLATILE;
ALTER FUNCTION public.get_student_profile(uuid) VOLATILE;

NOTIFY pgrst, 'reload schema';
