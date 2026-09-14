import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useTenant } from "@/bootstrap/TenantProvider";
import { BrandPublicLayout } from "@/features/brand/BrandPublicLayout";
import { CenterPublicLayout } from "@/features/center/CenterPublicLayout";
import { MarketingPublicOriginProvider } from "@/features/marketing/MarketingPublicOrigin";
import { brandPortalUrl, centerPortalUrl } from "@/lib/brandPortalUrl";
import { resolveLearnLoginCenterSlug } from "@/lib/learnLoginChrome";

/**
 * Student `/login` on the learn host uses franchise public nav/footer when the center
 * is known (`?center=`, franchise referrer, or sessionStorage). Nav/CTA links point at
 * that franchise (or brand) public origin so they do not stay on the learn app.
 */
export function LearnPublicLoginLayout() {
  const tenant = useTenant();
  const [searchParams] = useSearchParams();
  const brandSlug = tenant.brandSlug?.trim() ?? "";
  const centerSlug = resolveLearnLoginCenterSlug({
    brandSlug,
    queryCenter: searchParams.get("center"),
    referrer: typeof document !== "undefined" ? document.referrer : "",
  });

  const origin = useMemo(() => {
    if (!brandSlug) return null;
    const url = centerSlug ? centerPortalUrl(brandSlug, centerSlug) : brandPortalUrl(brandSlug);
    return url.replace(/\/$/, "");
  }, [brandSlug, centerSlug]);

  return (
    <MarketingPublicOriginProvider origin={origin}>
      {centerSlug ? <CenterPublicLayout centerSlug={centerSlug} /> : <BrandPublicLayout />}
    </MarketingPublicOriginProvider>
  );
}
