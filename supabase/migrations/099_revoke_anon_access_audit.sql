-- 098 revoked PUBLIC only; Supabase default privileges also grant EXECUTE to anon directly.

REVOKE ALL ON FUNCTION public.log_access_audit_event(text, text, uuid, text, uuid, uuid, text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_access_audit_event(text, text, uuid, text, uuid, uuid, text, text, jsonb) TO authenticated;

REVOKE ALL ON FUNCTION public.can_read_staff_audit(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_read_staff_audit(uuid, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.list_tenant_staff_audit(uuid, uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_tenant_staff_audit(uuid, uuid, integer) TO authenticated;
