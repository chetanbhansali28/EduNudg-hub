import { getSupabase } from "@/lib/supabase";
import { uploadBrandLogo } from "@/lib/brandLogoStorage";
import { buildBrandLandingConfig, mergeAbacusClassicLandingConfig, mergeSparkAcademyLandingConfig } from "@/lib/brandLandingDefaults";
import { buildCenterLandingConfig, mergeSparkAcademyCenterLandingConfig, mergeAbacusClassicCenterLandingConfig, CENTER_LANDING_EDITOR_PLACEHOLDER_NAME } from "@/lib/centerLandingDefaults";
import { mergeSectionVisibility, ABACUS_CLASSIC_SECTION_DEFAULTS, SPARK_ACADEMY_SECTION_DEFAULTS, DEFAULT_HOMEPAGE_SECTION_VISIBILITY } from "@/lib/homepageSections";
import { preserveCustomMarketingMediaUrls } from "@/lib/marketingMediaGuard";
import { parseMarketingTheme, type MarketingTheme } from "@/types/homepage";
import { parseBrandLegalPages, type BrandLegalPages } from "@/lib/brandLegalPages";
import { parseBrandSocialConnect, type BrandSocialConnect } from "@/lib/brandSocialConnect";
import type { HomepageConfig } from "@/types/homepage";

export type BrandMarketingSettingsKey = "landing" | "center_landing";

export type BrandMarketingEditorData = {
  settingsId: string | null;
  existingSettings: Record<string, unknown>;
  brandName: string;
  brandSlug: string;
  brandLogoUrl: string | null;
  marketingTheme: MarketingTheme;
  landingConfig: HomepageConfig;
  centerLandingConfig: HomepageConfig;
  legalPages: BrandLegalPages;
  socialConnect: BrandSocialConnect;
};

/** Serializable subset of homepage config stored in brand_settings.settings. */
export function landingConfigToPartial(
  config: HomepageConfig,
  options?: { marketingTheme?: MarketingTheme }
): Partial<HomepageConfig> {
  const sectionDefaults =
    options?.marketingTheme === "abacus-classic"
      ? ABACUS_CLASSIC_SECTION_DEFAULTS
      : options?.marketingTheme === "spark-academy"
        ? SPARK_ACADEMY_SECTION_DEFAULTS
        : DEFAULT_HOMEPAGE_SECTION_VISIBILITY;

  return {
    meta: { ...config.meta },
    theme: { ...config.theme },
    nav: {
      links: config.nav.links.map((link) => ({ ...link })),
      ctaLabel: config.nav.ctaLabel,
      ctaHref: config.nav.ctaHref,
      adminHref: config.nav.adminHref,
      ...(config.nav.secondaryCtaLabel ? { secondaryCtaLabel: config.nav.secondaryCtaLabel } : {}),
      ...(config.nav.secondaryCtaHref ? { secondaryCtaHref: config.nav.secondaryCtaHref } : {}),
    },
    hero: { ...config.hero },
    featureSections: config.featureSections.map((section) => ({ ...section })),
    featuresShowcase: config.featuresShowcase ? { ...config.featuresShowcase } : undefined,
    showcaseCards: config.showcaseCards.map((card) => ({ ...card })),
    testimonials: {
      ...config.testimonials,
      items: config.testimonials.items.map((item) => ({ ...item })),
    },
    faq: config.faq.map((item) => ({ ...item })),
    privacy: { ...config.privacy },
    footerCta: { ...config.footerCta },
    footer: { ...config.footer },
    sections: { ...mergeSectionVisibility(config.sections, sectionDefaults) },
    founders: config.founders?.map((f) => ({ ...f, statBadge: f.statBadge ? { ...f.statBadge } : undefined })),
    trustMedia: config.trustMedia
      ? {
          ...config.trustMedia,
          cards: config.trustMedia.cards.map((c) => ({ ...c })),
        }
      : undefined,
    gallery: config.gallery
      ? { ...config.gallery, images: config.gallery.images.map((img) => ({ ...img })) }
      : undefined,
    programsSection: config.programsSection
      ? {
          ...config.programsSection,
          cards: config.programsSection.cards?.map((card) => ({
            ...card,
            benefits: card.benefits ? [...card.benefits] : undefined,
          })),
        }
      : undefined,
    upcomingEvents: config.upcomingEvents
      ? {
          ...config.upcomingEvents,
          items: config.upcomingEvents.items.map((item) => ({ ...item })),
        }
      : undefined,
    about: config.about
      ? {
          ...config.about,
          features: config.about.features.map((f) => ({ ...f })),
          members: config.about.members.map((m) => ({ ...m })),
        }
      : undefined,
  };
}

export async function fetchBrandMarketingEditor(brandId: string): Promise<BrandMarketingEditorData> {
  const [brandRes, settingsRes] = await Promise.all([
    getSupabase().from("brands").select("name, slug, logo_url, marketing_theme").eq("id", brandId).single(),
    getSupabase().from("brand_settings").select("id, settings").eq("brand_id", brandId).maybeSingle(),
  ]);

  if (brandRes.error) throw new Error(brandRes.error.message);

  const brand = brandRes.data;
  const settings = settingsRes.data;
  const existingSettings = (settings?.settings ?? {}) as Record<string, unknown>;
  const landingPartial = (existingSettings.landing ?? {}) as Partial<HomepageConfig>;
  const centerLandingPartial = (existingSettings.center_landing ?? {}) as Partial<HomepageConfig>;
  const marketingTheme = parseMarketingTheme(brand.marketing_theme);

  const landingConfig =
    marketingTheme === "abacus-classic"
      ? mergeAbacusClassicLandingConfig(brand.name, landingPartial, brand.logo_url)
      : marketingTheme === "spark-academy"
        ? mergeSparkAcademyLandingConfig(brand.name, landingPartial, brand.logo_url)
        : buildBrandLandingConfig(brand.name, landingPartial, brand.logo_url);

  return {
    settingsId: settings?.id ?? null,
    existingSettings,
    brandName: brand.name,
    brandSlug: brand.slug,
    brandLogoUrl: brand.logo_url,
    marketingTheme,
    landingConfig,
    centerLandingConfig:
      marketingTheme === "abacus-classic"
        ? mergeAbacusClassicCenterLandingConfig(
            CENTER_LANDING_EDITOR_PLACEHOLDER_NAME,
            brand.name,
            "your city",
            centerLandingPartial,
            brand.logo_url
          )
        : marketingTheme === "spark-academy"
          ? mergeSparkAcademyCenterLandingConfig(
              CENTER_LANDING_EDITOR_PLACEHOLDER_NAME,
              brand.name,
              "your city",
              centerLandingPartial,
              brand.logo_url
            )
          : buildCenterLandingConfig(
              CENTER_LANDING_EDITOR_PLACEHOLDER_NAME,
              brand.name,
              "your city",
              centerLandingPartial,
              brand.logo_url
            ),
    legalPages: parseBrandLegalPages(existingSettings),
    socialConnect: parseBrandSocialConnect(existingSettings, landingPartial),
  };
}

async function persistBrandSettings(
  brandId: string,
  settingsId: string | null,
  merged: Record<string, unknown>
): Promise<void> {
  if (settingsId) {
    const { error } = await getSupabase().from("brand_settings").update({ settings: merged }).eq("id", settingsId);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await getSupabase().from("brand_settings").insert({ brand_id: brandId, settings: merged });
  if (error) throw new Error(error.message);
}

export async function saveBrandLegalPages(
  brandId: string,
  settingsId: string | null,
  existingSettings: Record<string, unknown>,
  legalPages: BrandLegalPages
): Promise<void> {
  await persistBrandSettings(brandId, settingsId, {
    ...existingSettings,
    legal_pages: legalPages,
  });
}

export async function saveBrandMarketingLanding(
  brandId: string,
  settingsId: string | null,
  existingSettings: Record<string, unknown>,
  key: BrandMarketingSettingsKey,
  config: HomepageConfig,
  options?: { marketingTheme?: MarketingTheme }
): Promise<void> {
  const existingPartial = (existingSettings[key] ?? {}) as Partial<HomepageConfig>;
  const nextPartial = preserveCustomMarketingMediaUrls(
    existingPartial,
    landingConfigToPartial(config, options)
  );
  const merged = {
    ...existingSettings,
    [key]: nextPartial,
  };

  await persistBrandSettings(brandId, settingsId, merged);

  if (key === "landing") {
    await syncBrandLogoFromSiteLogo(brandId, siteLogoUrlFromConfig(nextPartial));
  }
}

export function landingPartialFromBrandSettings(
  settings: Record<string, unknown> | null | undefined
): Partial<HomepageConfig> {
  const landing = settings?.landing;
  if (!landing || typeof landing !== "object" || Array.isArray(landing)) return {};
  return landing as Partial<HomepageConfig>;
}

/** Homepage Site logo, then `brands.logo_url` fallback used by login / admin chrome. */
export function resolvedBrandSiteLogoUrl(
  settings: Record<string, unknown> | null | undefined,
  brandLogoUrl: string | null | undefined
): string | null {
  return siteLogoUrlFromConfig(landingPartialFromBrandSettings(settings)) ?? (brandLogoUrl?.trim() || null);
}

export type BrandLandingSiteIdentityPatch = {
  logoUrl?: string | null;
  siteName?: string | null;
};

/**
 * Writes platform-admin identity fields into the same `landing.meta` store as `/app/homepage`.
 * Merges into existing `brand_settings.settings` so feature flags and other landing sections stay.
 */
export async function patchBrandLandingSiteIdentity(
  brandId: string,
  patch: BrandLandingSiteIdentityPatch
): Promise<void> {
  const logoUrl = patch.logoUrl?.trim() || undefined;
  const siteName = patch.siteName?.trim() || undefined;
  if (!logoUrl && !siteName) return;

  const { data, error } = await getSupabase()
    .from("brand_settings")
    .select("id, settings")
    .eq("brand_id", brandId)
    .maybeSingle();
  if (error) throw new Error(error.message);

  const existingSettings = { ...((data?.settings ?? {}) as Record<string, unknown>) };
  const existingLanding = landingPartialFromBrandSettings(existingSettings);
const existingMeta: Partial<HomepageConfig["meta"]> = { ...(existingLanding.meta ?? {}) };
  if (logoUrl) existingMeta.logoUrl = logoUrl;
  if (siteName) existingMeta.siteName = siteName;

  const nextLanding = preserveCustomMarketingMediaUrls(existingLanding, {
    ...existingLanding,
    meta: existingMeta,
  });
  const merged = {
    ...existingSettings,
    landing: nextLanding,
  };

  await persistBrandSettings(brandId, data?.id ?? null, merged);

  if (logoUrl) {
    await syncBrandLogoFromSiteLogo(brandId, logoUrl);
  }
}

/** Platform `/admin/brands/:slug` logo upload — same JSON as Homepage Site logo. */
export async function uploadBrandSiteLogo(brandId: string, file: File): Promise<string> {
  const publicUrl = await uploadBrandLogo(brandId, file);
  await patchBrandLandingSiteIdentity(brandId, { logoUrl: publicUrl });
  return publicUrl;
}

/** Homepage Site accordion logo (`landing.meta.logoUrl`). Empty does not clear `brands.logo_url`. */
export function siteLogoUrlFromConfig(config: HomepageConfig | Partial<HomepageConfig>): string | null {
  const url = config.meta?.logoUrl?.trim();
  return url || null;
}

/** Copies homepage Site logo onto `brands.logo_url` for login / student / app chrome. */
export async function syncBrandLogoFromSiteLogo(brandId: string, logoUrl: string | null): Promise<void> {
  if (!logoUrl) return;
  const { error } = await getSupabase().from("brands").update({ logo_url: logoUrl }).eq("id", brandId);
  if (error) throw new Error(error.message);
}
