import { useQuery } from "@tanstack/react-query";
import { useStaffProfile } from "@/hooks/useStaffProfile";
import { fetchPlatformDashboardHome } from "@/lib/platformDashboardApi";
import { CommandCenterView } from "./CommandCenterView";

export function CommandCenter() {
  const profile = useStaffProfile();
  const dashboard = useQuery({
    queryKey: ["platform-dashboard"],
    queryFn: () => fetchPlatformDashboardHome(),
  });

  if (dashboard.isLoading) {
    return <p className="ed-text-sm ed-muted">Loading dashboard…</p>;
  }

  if (!dashboard.data) {
    return <p className="ed-empty">Dashboard data unavailable.</p>;
  }

  return <CommandCenterView data={dashboard.data} displayName={profile.name} />;
}
