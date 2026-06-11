import type { HomepageConfig } from "@/types/homepage";

/** Platform admin shell branding — matches marketing nav (`config.meta`). */
export function platformShellFromHomepage(config: HomepageConfig | undefined): {
  productName: string;
  logoUrl: string | null;
} {
  const productName = config?.meta?.siteName?.trim() || "EduNudg";
  const logoUrl = config?.meta?.logoUrl?.trim() || null;
  return { productName, logoUrl };
}
