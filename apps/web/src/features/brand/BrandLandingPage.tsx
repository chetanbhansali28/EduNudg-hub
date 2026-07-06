import { useOutletContext } from "react-router-dom";
import { AbacusClassicContent } from "@/features/marketing/abacus-classic";
import { SparkAcademyContent } from "@/features/marketing/spark-academy";
import { MarketingContent } from "@/features/marketing/MarketingContent";
import { BrandWhatsAppFloat } from "@/features/marketing/BrandWhatsAppFloat";
import type { BrandLandingOutletContext } from "@/features/brand/BrandPublicLayout";

export function BrandLandingPage() {
  const ctx = useOutletContext<BrandLandingOutletContext>();

  const content =
    ctx.marketingTheme === "abacus-classic" ? (
      <AbacusClassicContent config={ctx.config} publicCurriculum={ctx.publicCurriculum} />
    ) : ctx.marketingTheme === "spark-academy" ? (
      <SparkAcademyContent
        config={ctx.config}
        portalMode="brand"
        brandSlug={ctx.brandSlug}
        publicCurriculum={ctx.publicCurriculum}
        publicStats={ctx.publicStats}
      />
    ) : (
      <MarketingContent
        config={ctx.config}
        portalMode="brand"
        brandSlug={ctx.brandSlug}
        publicCurriculum={ctx.publicCurriculum}
      />
    );

  return (
    <>
      {content}
      <BrandWhatsAppFloat socialConnect={ctx.socialConnect} />
    </>
  );
}
