import { getSupabase } from "@/lib/supabase";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/homepageDefaults";
import type { HomepageConfig, HomepageShowcaseCard, HomepageTestimonial } from "@/types/homepage";

const HOMEPAGE_KEY = "marketing_homepage";

export async function fetchHomepageConfig(): Promise<HomepageConfig> {
  try {
    const { data, error } = await getSupabase()
      .from("platform_settings")
      .select("value")
      .eq("key", HOMEPAGE_KEY)
      .maybeSingle();

    if (error || !data?.value) {
      return DEFAULT_HOMEPAGE_CONFIG;
    }
    return mergeHomepageConfig(data.value as Partial<HomepageConfig>);
  } catch {
    return DEFAULT_HOMEPAGE_CONFIG;
  }
}

export async function saveHomepageConfig(config: HomepageConfig): Promise<void> {
  const { error } = await getSupabase()
    .from("platform_settings")
    .upsert({ key: HOMEPAGE_KEY, value: config }, { onConflict: "key" });

  if (error) throw new Error(error.message);
}

export function mergeHomepageConfig(partial: Partial<HomepageConfig>): HomepageConfig {
  const legacy = partial as Partial<HomepageConfig> & {
    hero?: Partial<HomepageConfig["hero"]> & { line2?: string; ctaPrimary?: { label: string; href: string } };
    testimonials?: HomepageTestimonial[] | HomepageConfig["testimonials"];
  };

  type LegacyTestimonial = { quote: string; author: string };
  const testimonials =
    legacy.testimonials && "items" in legacy.testimonials
      ? { ...DEFAULT_HOMEPAGE_CONFIG.testimonials, ...legacy.testimonials }
      : Array.isArray(legacy.testimonials)
        ? { ...DEFAULT_HOMEPAGE_CONFIG.testimonials, items: legacy.testimonials as LegacyTestimonial[] }
        : DEFAULT_HOMEPAGE_CONFIG.testimonials;

  type LegacyHero = Partial<HomepageConfig["hero"]> & {
    line2?: string;
    ctaPrimary?: { label: string; href: string };
  };
  const heroPartial: LegacyHero = legacy.hero ?? {};
  const hero: HomepageConfig["hero"] = {
    ...DEFAULT_HOMEPAGE_CONFIG.hero,
    ...heroPartial,
    line1Serif:
      heroPartial.line1Serif ??
      heroPartial.line2?.split(" ").pop() ??
      DEFAULT_HOMEPAGE_CONFIG.hero.line1Serif,
    line2Serif: heroPartial.line2Serif ?? DEFAULT_HOMEPAGE_CONFIG.hero.line2Serif,
    ctaLabel:
      heroPartial.ctaLabel ?? heroPartial.ctaPrimary?.label ?? DEFAULT_HOMEPAGE_CONFIG.hero.ctaLabel,
    ctaHref:
      heroPartial.ctaHref ?? heroPartial.ctaPrimary?.href ?? DEFAULT_HOMEPAGE_CONFIG.hero.ctaHref,
  };

  const featureSections =
    legacy.featureSections?.map((s, i) => {
      const def = DEFAULT_HOMEPAGE_CONFIG.featureSections[i];
      const old = s as HomepageConfig["featureSections"][0] & { titleLine2?: string };
      return {
        id: old.id ?? def?.id ?? `section-${i}`,
        title: old.title ?? def?.title ?? "",
        titleSerif: old.titleSerif ?? old.titleLine2 ?? def?.titleSerif ?? "",
        body: old.body ?? def?.body ?? "",
        videoUrl: old.videoUrl ?? def?.videoUrl,
      };
    }) ?? DEFAULT_HOMEPAGE_CONFIG.featureSections;

  return {
    ...DEFAULT_HOMEPAGE_CONFIG,
    ...partial,
    meta: { ...DEFAULT_HOMEPAGE_CONFIG.meta, ...partial.meta },
    theme: { ...DEFAULT_HOMEPAGE_CONFIG.theme, ...partial.theme },
    nav: {
      ...DEFAULT_HOMEPAGE_CONFIG.nav,
      ...partial.nav,
      links: partial.nav?.links ?? DEFAULT_HOMEPAGE_CONFIG.nav.links,
    },
    hero,
    featureSections,
    showcaseCards:
      partial.showcaseCards?.map((c, i) => {
        const def = DEFAULT_HOMEPAGE_CONFIG.showcaseCards[i];
        const old = c as HomepageShowcaseCard & { variant?: string };
        const layout =
          old.layout ??
          (old.variant === "dark" ? "image-dark" : def?.layout ?? "image-dark");
        return { ...def, ...old, layout };
      }) ?? DEFAULT_HOMEPAGE_CONFIG.showcaseCards,
    privacy: { ...DEFAULT_HOMEPAGE_CONFIG.privacy, ...partial.privacy },
    testimonials,
    faq: partial.faq ?? DEFAULT_HOMEPAGE_CONFIG.faq,
    footerCta: { ...DEFAULT_HOMEPAGE_CONFIG.footerCta, ...partial.footerCta },
    footer: { ...DEFAULT_HOMEPAGE_CONFIG.footer, ...partial.footer },
  };
}
