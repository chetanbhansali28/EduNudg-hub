import { useQuery } from "@tanstack/react-query";
import { useTenant } from "@/bootstrap/TenantProvider";
import { getSupabase } from "@/lib/supabase";

/** Resolves brand_id for brand portal routes (domain mapping or hostname slug). */
export function useBrandScope() {
  const tenant = useTenant();

  const resolved = useQuery({
    queryKey: ["brand-scope", tenant.brandId, tenant.brandSlug],
    enabled: tenant.portalType === "brand",
    queryFn: async () => {
      if (tenant.brandId) return tenant.brandId;
      if (!tenant.brandSlug) return null;
      const { data, error } = await getSupabase()
        .from("brands")
        .select("id")
        .eq("slug", tenant.brandSlug)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) throw error;
      return data?.id ?? null;
    },
    staleTime: 60_000,
  });

  const brandId = tenant.brandId ?? resolved.data ?? null;

  return {
    brandId,
    brandSlug: tenant.brandSlug,
    isLoading: resolved.isLoading && !tenant.brandId,
    missingBrand: !resolved.isLoading && !brandId,
  };
}
