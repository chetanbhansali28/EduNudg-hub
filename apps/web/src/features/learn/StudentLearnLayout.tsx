import { Outlet, useLocation } from "react-router-dom";
import { AppShell } from "@edunudg/ui";
import { useAuth } from "@/bootstrap/AuthProvider";
import { useTenant } from "@/bootstrap/TenantProvider";
import { usePortalBranding } from "@/hooks/usePortalBranding";
import { useStaffShellWelcome } from "@/hooks/useStaffShellWelcome";
import { studentNavSections, signOutNavItem } from "@/lib/portalNav";
import { resolveShellProductName } from "@/lib/portalBranding";
import "@/features/learn/studentPortal.css";

export function StudentLearnLayout() {
  const { pathname } = useLocation();
  const { signOut } = useAuth();
  const tenant = useTenant();
  const { data: branding } = usePortalBranding();
  const shell = resolveShellProductName(
    tenant.portalType,
    branding ?? {
      brandId: null,
      brandSlug: null,
      brandName: null,
      brandLogoUrl: null,
      centerId: null,
      centerSlug: null,
      centerName: null,
      loginHeadline: null,
      loginSubtext: null,
    },
    tenant.brandSlug,
    tenant.centerSlug
  );
  const portalLabel = `Learn · ${shell.productName}`;
  const welcome = useStaffShellWelcome(portalLabel);

  return (
    <AppShell
      productName={shell.productName}
      logoUrl={shell.logoUrl}
      portalLabel={portalLabel}
      welcomeHeading={welcome.welcomeHeading}
      welcomeSubtitle="Your progress, exams, and competitions — all in one place."
      user={welcome.user}
      navSections={studentNavSections(pathname)}
      footerItems={[signOutNavItem(() => void signOut())]}
      showUpgradeCard={false}
    >
      <div className="ed-student-portal">
        <Outlet />
      </div>
    </AppShell>
  );
}
