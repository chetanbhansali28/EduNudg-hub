-- RLS policies for platform admin CRUD on invoices, tickets, analytics rollups

CREATE POLICY platform_invoices_admin ON public.platform_invoices
  FOR ALL TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE POLICY platform_invoices_brand_read ON public.platform_invoices
  FOR SELECT TO authenticated
  USING (public.has_brand_access(brand_id));

CREATE POLICY support_tickets_admin ON public.support_tickets
  FOR ALL TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE POLICY support_tickets_brand_read ON public.support_tickets
  FOR SELECT TO authenticated
  USING (brand_id IS NULL OR public.has_brand_access(brand_id));

CREATE POLICY analytics_daily_brand_admin ON public.analytics_daily_brand
  FOR ALL TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE POLICY analytics_daily_center_admin ON public.analytics_daily_center
  FOR ALL TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE POLICY brand_status_events_admin ON public.brand_status_events
  FOR ALL TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE POLICY platform_audit_admin_delete ON public.platform_audit_logs
  FOR DELETE TO authenticated
  USING (public.is_platform_admin());

CREATE POLICY platform_audit_admin_update ON public.platform_audit_logs
  FOR UPDATE TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());
