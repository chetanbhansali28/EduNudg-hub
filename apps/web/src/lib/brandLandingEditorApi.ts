import { getSupabase } from "@/lib/supabase";
import { buildBrandLandingConfig } from "@/lib/brandLandingDefaults";
import { buildCenterLandingConfig } from "@/lib/centerLandingDefaults";
import { mergeSectionVisibility } from "@/lib/homepageSections";
import type { HomepageConfig } from "@/types/homepage";

export type BrandMarketingSettingsKey = "landing" | "center_landing";

export type BrandMarketingEditorData = {
  settingsId: string | null;
  existingSettings: Record<string, unknown>;
  brandName: string;
  brandSlug: string;
  brandLogoUrl: string | null;
  landingConfig: HomepageConfig;
  centerLandingConfig: HomepageConfig;
};

/** Serializable subset of homepage config stored in brand_settings.settings. */
export function landingConfigToPartial(config: HomepageConfig): Partial<HomepageConfig> {
  return {
    meta: { ...config.meta },
    nav: {
      links: config.nav.links.map((link) => ({ ...link })),
      ctaLabel: config.nav.ctaLabel,
      ctaHref: config.nav.ctaHref,
      adminHref: config.nav.adminHref,
    },
    hero: { ...config.hero },
    featureSections: config.featureSections.map((section) => ({ ...section })),
    showcaseCards: config.showcaseCards.map((card) => ({ ...card })),
    testimonials: {
      ...config.testimonials,
      items: config.testimonials.items.map((item) => ({ ...item })),
    },
    faq: config.faq.map((item) => ({ ...item })),
    privacy: { ...config.privacy },
    footerCta: { ...config.footerCta },
    footer: { ...config.footer },
    sections: { ...mergeSectionVisibility(config.sections) },
  };
}

export async function fetchBrandMarketingEditor(brandId: string): Promise<BrandMarketingEditorData> {
  const [brandRes, settingsRes] = await Promise.all([
    getSupabase().from("brands").select("name, slug, logo_url").eq("id", brandId).single(),
    getSupabase().from("brand_settings").select("id, settings").eq("brand_id", brandId).maybeSingle(),
  ]);

  if (brandRes.error) throw new Error(brandRes.error.message);

  const brand = brandRes.data;
  const settings = settingsRes.data;
  const existingSettings = (settings?.settings ?? {}) as Record<string, unknown>;
  const landingPartial = (existingSettings.landing ?? {}) as Partial<HomepageConfig>;
  const centerLandingPartial = (existingSettings.center_landing ?? {}) as Partial<HomepageConfig>;

  return {
    settingsId: settings?.id ?? null,
    existingSettings,
    brandName: brand.name,
    brandSlug: brand.slug,
    brandLogoUrl: brand.logo_url,
    landingConfig: buildBrandLandingConfig(brand.name, landingPartial, brand.logo_url),
    centerLandingConfig: buildCenterLandingConfig(
      "Sample Center",
      brand.name,
      "your city",
      centerLandingPartial,
      brand.logo_url
    ),
  };
}

export async function saveBrandMarketingLanding(
  brandId: string,
  settingsId: string | null,
  existingSettings: Record<string, unknown>,
  key: BrandMarketingSettingsKey,
  config: HomepageConfig
): Promise<void> {
  const merged = {
    ...existingSettings,
    [key]: landingConfigToPartial(config),
  };

  if (settingsId) {
    const { error } = await getSupabase().from("brand_settings").update({ settings: merged }).eq("id", settingsId);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await getSupabase().from("brand_settings").insert({ brand_id: brandId, settings: merged });
  if (error) throw new Error(error.message);
}
