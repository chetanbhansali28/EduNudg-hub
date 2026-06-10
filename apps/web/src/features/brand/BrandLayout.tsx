import { Outlet, useLocation } from "react-router-dom";
import { AppShell } from "@edunudg/ui";
import { useAuth } from "@/bootstrap/AuthProvider";
import { useTenant } from "@/bootstrap/TenantProvider";
import { usePortalBranding } from "@/hooks/usePortalBranding";
import { useBrandFeatureFlags } from "@/hooks/useFeatureFlag";
import { useStaffShellWelcome } from "@/hooks/useStaffShellWelcome";
import { brandNavSections, filterNavByFeatureFlags, signOutNavItem, BRAND_FEATURE_FLAGS } from "@/lib/portalNav";
import { resolveShellProductName } from "@/lib/portalBranding";

export function BrandLayout() {
  const { pathname } = useLocation();
  const { signOut } = useAuth();
  const tenant = useTenant();
  const { data: branding } = usePortalBranding();
  const featureFlags = useBrandFeatureFlags();
  const navSections = filterNavByFeatureFlags(brandNavSections(pathname), featureFlags, BRAND_FEATURE_FLAGS);
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
  const portalLabel = `Brand · ${shell.productName}`;
  const welcome = useStaffShellWelcome(portalLabel);

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
    >
      <Outlet />
    </AppShell>
  );
}
