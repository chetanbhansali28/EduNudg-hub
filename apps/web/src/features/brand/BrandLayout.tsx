import { Outlet, useLocation } from "react-router-dom";
import { AppShell } from "@edunudg/ui";
import { useAuth } from "@/bootstrap/AuthProvider";
import { useTenant } from "@/bootstrap/TenantProvider";
import { usePortalBranding } from "@/hooks/usePortalBranding";
import { brandNavSections, signOutNavItem } from "@/lib/portalNav";
import { resolveShellProductName } from "@/lib/portalBranding";
import { displayUserFromAuth } from "@/lib/portalUser";

export function BrandLayout() {
  const { pathname } = useLocation();
  const { signOut, user } = useAuth();
  const tenant = useTenant();
  const profile = displayUserFromAuth(user);
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

  return (
    <AppShell
      productName={shell.productName}
      logoUrl={shell.logoUrl}
      portalLabel={`Brand · ${shell.productName}`}
      welcomeName={profile.name}
      user={profile}
      navSections={brandNavSections(pathname)}
      footerItems={[signOutNavItem(() => void signOut())]}
      showUpgradeCard={false}
    >
      <Outlet />
    </AppShell>
  );
}
