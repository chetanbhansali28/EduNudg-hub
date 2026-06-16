import { useQuery } from "@tanstack/react-query";
import { useStaffProfile } from "@/hooks/useStaffProfile";
import { fetchBrandDashboardHome } from "@/lib/brandDashboardHomeApi";
import { useBrandScope } from "./hooks/useBrandScope";
import { BrandDashboardView } from "./dashboard/BrandDashboardView";

export function BrandDashboard() {
  const { brandId, missingBrand } = useBrandScope();
  const profile = useStaffProfile();

  const dashboard = useQuery({
    queryKey: ["brand-dashboard", brandId],
    enabled: !!brandId,
    queryFn: () => fetchBrandDashboardHome(brandId!),
  });

  if (missingBrand) {
    return <p className="ed-empty">Brand context not found.</p>;
  }

  if (dashboard.isLoading) {
    return <p className="ed-text-sm ed-muted">Loading dashboard…</p>;
  }

  if (!dashboard.data) {
    return <p className="ed-empty">Dashboard data unavailable.</p>;
  }

  return <BrandDashboardView data={dashboard.data} displayName={profile.name} />;
}
