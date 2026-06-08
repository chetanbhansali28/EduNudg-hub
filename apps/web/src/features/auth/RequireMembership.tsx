import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { ThemeProvider } from "@edunudg/ui";
import { useTenant } from "@/bootstrap/TenantProvider";
import { useMembership } from "@/hooks/useMembership";
import { useResolvedPortalTenant } from "@/hooks/useResolvedPortalTenant";
import { hasPortalMembership } from "@/lib/portalMembership";

export function RequireMembership({ children }: { children: ReactNode }) {
  const tenant = useTenant();
  const { tenant: portalTenant, isResolving: portalTenantResolving } = useResolvedPortalTenant();
  const { data: memberships, isLoading } = useMembership();

  if (tenant.portalType === "learn" || tenant.portalType === "parents") {
    return <>{children}</>;
  }

  if (isLoading || portalTenantResolving) {
    return (
      <ThemeProvider>
        <div className="ed-login">
          <p className="ed-empty">Checking access…</p>
        </div>
      </ThemeProvider>
    );
  }

  if (!hasPortalMembership(memberships, portalTenant)) {
    return <Navigate to="/login" replace state={{ reason: "no_membership" }} />;
  }

  return <>{children}</>;
}
