import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/bootstrap/AuthProvider";
import { useStaffProfile } from "@/hooks/useStaffProfile";
import { fetchBrandDashboardHome } from "@/lib/brandDashboardHomeApi";
import {
  markCenterHealthReminderSeen,
  shouldShowCenterHealthReminder,
} from "@/lib/centerHealthReminder";
import { useBrandScope } from "./hooks/useBrandScope";
import { BrandDashboardView } from "./dashboard/BrandDashboardView";
import { CenterHealthReminderDialog } from "./dashboard/CenterHealthReminderDialog";

export function BrandDashboard() {
  const { brandId, missingBrand } = useBrandScope();
  const profile = useStaffProfile();
  const { user } = useAuth();
  const [reminderOpen, setReminderOpen] = useState(false);

  const dashboard = useQuery({
    queryKey: ["brand-dashboard", brandId],
    enabled: !!brandId,
    queryFn: () => fetchBrandDashboardHome(brandId!),
  });

  useEffect(() => {
    if (!brandId || !user?.id || !dashboard.data) return;
    if (
      !shouldShowCenterHealthReminder({
        percent: dashboard.data.centerHealthPercent,
        brandId,
        userId: user.id,
      })
    ) {
      return;
    }
    markCenterHealthReminderSeen(brandId, user.id);
    setReminderOpen(true);
  }, [brandId, user?.id, dashboard.data]);

  if (missingBrand) {
    return <p className="ed-empty">Brand context not found.</p>;
  }

  if (dashboard.isLoading) {
    return <p className="ed-text-sm ed-muted">Loading dashboard…</p>;
  }

  if (!dashboard.data) {
    return <p className="ed-empty">Dashboard data unavailable.</p>;
  }

  return (
    <>
      <BrandDashboardView data={dashboard.data} displayName={profile.name} />
      {reminderOpen ? (
        <CenterHealthReminderDialog
          open
          data={dashboard.data}
          onClose={() => setReminderOpen(false)}
        />
      ) : null}
    </>
  );
}
