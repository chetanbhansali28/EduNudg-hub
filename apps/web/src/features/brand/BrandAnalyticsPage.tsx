import { useBrandMonitoringStats } from "@/hooks/useBrandMonitoringStats";
import { useOpsBreakpoint } from "@/features/center/hooks/useOpsBreakpoint";
import { useBrandScope } from "./hooks/useBrandScope";
import { BrandAnalyticsView } from "./analytics/BrandAnalyticsView";

export function BrandAnalyticsPage() {
  const { brandId, missingBrand } = useBrandScope();
  const stats = useBrandMonitoringStats(brandId);
  const { isMobile } = useOpsBreakpoint();

  if (missingBrand) {
    return <p className="ed-empty">Brand context not found.</p>;
  }

  if (stats.isLoading || !stats.data) {
    return <p className="ed-text-sm ed-muted">Loading analytics…</p>;
  }

  return <BrandAnalyticsView stats={stats.data} isMobile={isMobile} />;
}
