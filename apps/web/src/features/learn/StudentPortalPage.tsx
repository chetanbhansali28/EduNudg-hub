import { ComingSoonPage, ThemeProvider } from "@edunudg/ui";
import { useTenant } from "@/bootstrap/TenantProvider";
import { usePortalBranding } from "@/hooks/usePortalBranding";
import { resolveShellProductName } from "@/lib/portalBranding";

export function StudentPortalPage() {
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

  return (
    <ThemeProvider>
      <ComingSoonPage
        portalLabel="Student portal"
        productName={shell.productName}
        logoUrl={shell.logoUrl}
        message="Student learning features are coming in Phase 2."
      />
    </ThemeProvider>
  );
}
