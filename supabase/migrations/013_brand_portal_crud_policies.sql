-- Brand operators: manage analytics rollups and franchise inquiry status

CREATE POLICY franchise_inquiries_brand_update ON public.franchise_inquiries
  FOR UPDATE TO authenticated
  USING (public.has_brand_access(brand_id))
  WITH CHECK (public.has_brand_access(brand_id));

CREATE POLICY franchise_inquiries_brand_delete ON public.franchise_inquiries
  FOR DELETE TO authenticated
  USING (public.has_brand_access(brand_id));

CREATE POLICY analytics_daily_brand_mutate ON public.analytics_daily_brand
  FOR ALL TO authenticated
  USING (public.has_brand_access(brand_id))
  WITH CHECK (public.has_brand_access(brand_id));
