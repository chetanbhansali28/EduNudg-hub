import { useOutletContext } from "react-router-dom";
import { AbacusClassicContent } from "@/features/marketing/abacus-classic";
import { SparkAcademyContent } from "@/features/marketing/spark-academy";
import { MarketingContent } from "@/features/marketing/MarketingContent";
import type { BrandLandingOutletContext } from "@/features/brand/BrandPublicLayout";

export function BrandLandingPage() {
  const ctx = useOutletContext<BrandLandingOutletContext>();

  if (ctx.marketingTheme === "abacus-classic") {
    return (
      <AbacusClassicContent
        config={ctx.config}
        publicCurriculum={ctx.publicCurriculum}
      />
    );
  }

  if (ctx.marketingTheme === "spark-academy") {
    return (
      <SparkAcademyContent
        config={ctx.config}
        portalMode="brand"
        brandSlug={ctx.brandSlug}
        publicCurriculum={ctx.publicCurriculum}
        publicStats={ctx.publicStats}
      />
    );
  }

  return (
    <MarketingContent
      config={ctx.config}
      portalMode="brand"
      brandSlug={ctx.brandSlug}
      publicCurriculum={ctx.publicCurriculum}
    />
  );
}
