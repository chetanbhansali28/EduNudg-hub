import { useOutletContext } from "react-router-dom";
import { AbacusClassicContent } from "@/features/marketing/abacus-classic";
import { SparkAcademyContent } from "@/features/marketing/spark-academy";
import { MarketingContent } from "@/features/marketing/MarketingContent";
import type { CenterLandingOutletContext } from "@/features/center/CenterPublicLayout";

export function CenterLandingPage() {
  const ctx = useOutletContext<CenterLandingOutletContext>();

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
        portalMode="center"
        brandSlug={ctx.brandSlug}
        centerSlug={ctx.centerSlug}
        centerProfile={ctx.profile}
        publicCurriculum={ctx.publicCurriculum}
        publicStats={ctx.publicStats}
      />
    );
  }

  return (
    <MarketingContent
      config={ctx.config}
      portalMode="center"
      brandSlug={ctx.brandSlug}
      centerSlug={ctx.centerSlug}
      centerProfile={ctx.profile}
      publicCurriculum={ctx.publicCurriculum}
    />
  );
}
