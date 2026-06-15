import { Outlet, useLocation } from "react-router-dom";
import { AppShell } from "@edunudg/ui";
import { useAuth } from "@/bootstrap/AuthProvider";
import { useTenant } from "@/bootstrap/TenantProvider";
import { usePortalBranding } from "@/hooks/usePortalBranding";
import { useBrandFeatureFlags } from "@/hooks/useFeatureFlag";
import { useStaffShellWelcome } from "@/hooks/useStaffShellWelcome";
import { centerNavSections, filterNavByFeatureFlags, signOutNavItem, CENTER_FEATURE_FLAGS } from "@/lib/portalNav";
import { resolveShellProductName } from "@/lib/portalBranding";
import {
  CenterMerchandiseMobileBarEnd,
} from "@/features/center/merchandise/CenterMerchandiseMobileChrome";
import { CenterOpsMobileBarEnd, CenterOpsMobileChrome } from "@/features/center/CenterOpsMobileChrome";

export function CenterLayout() {
  const { pathname } = useLocation();
  const { signOut } = useAuth();
  const tenant = useTenant();
  const { data: branding } = usePortalBranding();
  const featureFlags = useBrandFeatureFlags();
  const navSections = filterNavByFeatureFlags(centerNavSections(pathname), featureFlags, CENTER_FEATURE_FLAGS);
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
  const portalLabel = `Center · ${shell.productName}`;
  const welcome = useStaffShellWelcome(portalLabel);
  const isMerchandise = pathname.startsWith("/app/merchandise");
  const isCurriculum = pathname.startsWith("/app/curriculum");
  const isAssessments = pathname.startsWith("/app/assessments");
  const isOpsRoute =
    pathname === "/app" ||
    pathname.startsWith("/app/leads") ||
    pathname.startsWith("/app/students") ||
    pathname.startsWith("/app/batches") ||
    pathname.startsWith("/app/settings") ||
    isCurriculum ||
    isAssessments;
  const storeTitle = branding?.brandName ? `${branding.brandName} Store` : `${shell.productName} Store`;
  const opsTitle = isCurriculum ? "Curriculum" : isAssessments ? "Assessments" : "Student Management";

  return (
    <AppShell
      productName={shell.productName}
      logoUrl={shell.logoUrl}
      portalLabel={portalLabel}
      welcomeHeading={welcome.welcomeHeading}
      welcomeSubtitle={welcome.welcomeSubtitle}
      user={welcome.user}
      navSections={navSections}
      footerItems={[signOutNavItem(() => void signOut())]}
      showUpgradeCard={false}
      showWelcome={!isMerchandise && !isOpsRoute}
      mobileBarTitle={isMerchandise ? storeTitle : isOpsRoute ? opsTitle : undefined}
      mobileBarEnd={
        isMerchandise ? <CenterMerchandiseMobileBarEnd /> : isOpsRoute ? <CenterOpsMobileBarEnd /> : undefined
      }
      shellClassName={isMerchandise ? "ed-shell--commerce" : isOpsRoute ? "ed-shell--ops" : undefined}
    >
      <Outlet />
      {isOpsRoute ? <CenterOpsMobileChrome /> : null}
    </AppShell>
  );
}
