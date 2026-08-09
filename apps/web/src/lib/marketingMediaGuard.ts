import type { HomepageConfig } from "@/types/homepage";

const BRAND_ASSETS_URL_RE = /\/storage\/v1\/object\/public\/brand-assets\//i;
const STOCK_UNSPLASH_RE = /images\.unsplash\.com/i;

/** Loose partial used when reading/writing stored landing JSON (fields are often incomplete). */
export type MarketingConfigPartial = {
  meta?: { logoUrl?: string | null };
  hero?: { backgroundImageUrl?: string; phoneFrameUrl?: string };
  connectivityShowcase?: { centerImageUrl?: string };
  brandSignup?: { promoImageUrl?: string };
  footerCta?: { backgroundImageUrl?: string };
  featuresShowcase?: { imageUrl?: string };
  trustMedia?: { youtubeUrl?: string; imageUrl?: string };
  featureSections?: Array<{ videoUrl?: string }>;
  showcaseCards?: Array<{ imageUrl?: string; phoneImageUrl?: string }>;
  founders?: Array<{ photoUrl?: string }>;
  gallery?: { images?: Array<{ url?: string }> };
  programsSection?: { cards?: Array<{ imageUrl?: string }> };
  testimonials?: { items?: Array<{ avatarUrl?: string }> };
  upcomingEvents?: { items?: Array<{ imageUrl?: string }> };
};

/** True when a URL points at uploaded `brand-assets` objects (not stock Unsplash). */
export function isBrandAssetsUrl(url: string | null | undefined): boolean {
  return typeof url === "string" && BRAND_ASSETS_URL_RE.test(url);
}

/** True when a URL is a stock Unsplash placeholder from defaults. */
export function isStockMarketingUrl(url: string | null | undefined): boolean {
  return typeof url === "string" && STOCK_UNSPLASH_RE.test(url);
}

function asMediaPartial(
  partial: Partial<HomepageConfig> | MarketingConfigPartial | null | undefined
): MarketingConfigPartial {
  return (partial ?? {}) as MarketingConfigPartial;
}

function collectMarketingMediaUrls(
  partial: Partial<HomepageConfig> | MarketingConfigPartial | null | undefined
): string[] {
  const p = asMediaPartial(partial);
  const urls: Array<string | undefined | null> = [
    p.meta?.logoUrl,
    p.hero?.backgroundImageUrl,
    p.hero?.phoneFrameUrl,
    p.connectivityShowcase?.centerImageUrl,
    p.brandSignup?.promoImageUrl,
    p.footerCta?.backgroundImageUrl,
    p.featuresShowcase?.imageUrl,
    p.trustMedia?.youtubeUrl,
    p.trustMedia?.imageUrl,
    ...(p.featureSections?.map((s) => s.videoUrl) ?? []),
    ...(p.showcaseCards?.flatMap((c) => [c.imageUrl, c.phoneImageUrl]) ?? []),
    ...(p.founders?.map((f) => f.photoUrl) ?? []),
    ...(p.gallery?.images?.map((img) => img.url) ?? []),
    ...(p.programsSection?.cards?.map((c) => c.imageUrl) ?? []),
    ...(p.testimonials?.items?.map((t) => t.avatarUrl) ?? []),
    ...(p.upcomingEvents?.items?.map((e) => e.imageUrl) ?? []),
  ];
  return urls.filter((u): u is string => typeof u === "string" && u.trim().length > 0);
}

/** Any platform / brand / center landing partial that references uploaded Storage media. */
export function hasCustomMarketingMedia(
  partial: Partial<HomepageConfig> | MarketingConfigPartial | null | undefined
): boolean {
  return collectMarketingMediaUrls(partial).some(isBrandAssetsUrl);
}

/** @deprecated Prefer hasCustomMarketingMedia — kept for existing platform callers. */
export const hasCustomPlatformMarketingMedia = hasCustomMarketingMedia;

function preferCustomUrl(
  existing: string | null | undefined,
  next: string | null | undefined
): string | undefined {
  if (isBrandAssetsUrl(existing) && (!next || isStockMarketingUrl(next) || next.trim() === "")) {
    return existing ?? undefined;
  }
  return next ?? existing ?? undefined;
}

/**
 * When saving editor output, never replace stored brand-assets URLs with Unsplash/empty stock.
 * Existing customized media wins over theme defaults that were materialized into the form.
 */
export function preserveCustomMarketingMediaUrls<T extends Partial<HomepageConfig> | MarketingConfigPartial>(
  existing: Partial<HomepageConfig> | MarketingConfigPartial | null | undefined,
  next: T
): T {
  const prev = asMediaPartial(existing);
  if (!hasCustomMarketingMedia(prev)) return next;

  const draft = asMediaPartial(next);
  const out: MarketingConfigPartial = { ...draft };

  if (draft.meta) {
    out.meta = { ...draft.meta, logoUrl: preferCustomUrl(prev.meta?.logoUrl, draft.meta.logoUrl) };
  }
  if (draft.hero) {
    out.hero = {
      ...draft.hero,
      backgroundImageUrl:
        preferCustomUrl(prev.hero?.backgroundImageUrl, draft.hero.backgroundImageUrl) ??
        draft.hero.backgroundImageUrl,
      phoneFrameUrl:
        preferCustomUrl(prev.hero?.phoneFrameUrl, draft.hero.phoneFrameUrl) ?? draft.hero.phoneFrameUrl,
    };
  }
  if (draft.connectivityShowcase) {
    out.connectivityShowcase = {
      ...draft.connectivityShowcase,
      centerImageUrl:
        preferCustomUrl(prev.connectivityShowcase?.centerImageUrl, draft.connectivityShowcase.centerImageUrl) ??
        draft.connectivityShowcase.centerImageUrl,
    };
  }
  if (draft.brandSignup) {
    out.brandSignup = {
      ...draft.brandSignup,
      promoImageUrl:
        preferCustomUrl(prev.brandSignup?.promoImageUrl, draft.brandSignup.promoImageUrl) ??
        draft.brandSignup.promoImageUrl,
    };
  }
  if (draft.footerCta) {
    out.footerCta = {
      ...draft.footerCta,
      backgroundImageUrl:
        preferCustomUrl(prev.footerCta?.backgroundImageUrl, draft.footerCta.backgroundImageUrl) ??
        draft.footerCta.backgroundImageUrl,
    };
  }
  if (draft.featuresShowcase) {
    out.featuresShowcase = {
      ...draft.featuresShowcase,
      imageUrl:
        preferCustomUrl(prev.featuresShowcase?.imageUrl, draft.featuresShowcase.imageUrl) ??
        draft.featuresShowcase.imageUrl,
    };
  }
  if (draft.trustMedia) {
    out.trustMedia = {
      ...draft.trustMedia,
      youtubeUrl:
        preferCustomUrl(prev.trustMedia?.youtubeUrl, draft.trustMedia.youtubeUrl) ?? draft.trustMedia.youtubeUrl,
      imageUrl:
        preferCustomUrl(prev.trustMedia?.imageUrl, draft.trustMedia.imageUrl) ?? draft.trustMedia.imageUrl,
    };
  }
  if (draft.featureSections) {
    out.featureSections = draft.featureSections.map((section, i) => ({
      ...section,
      videoUrl: preferCustomUrl(prev.featureSections?.[i]?.videoUrl, section.videoUrl) ?? section.videoUrl,
    }));
  }
  if (draft.showcaseCards) {
    out.showcaseCards = draft.showcaseCards.map((card, i) => {
      const prior = prev.showcaseCards?.[i];
      return {
        ...card,
        imageUrl: preferCustomUrl(prior?.imageUrl, card.imageUrl) ?? card.imageUrl,
        phoneImageUrl: preferCustomUrl(prior?.phoneImageUrl, card.phoneImageUrl) ?? card.phoneImageUrl,
      };
    });
  }
  if (draft.founders) {
    out.founders = draft.founders.map((founder, i) => ({
      ...founder,
      photoUrl: preferCustomUrl(prev.founders?.[i]?.photoUrl, founder.photoUrl) ?? founder.photoUrl,
    }));
  }
  if (draft.gallery?.images) {
    out.gallery = {
      ...draft.gallery,
      images: draft.gallery.images.map((img, i) => ({
        ...img,
        url: preferCustomUrl(prev.gallery?.images?.[i]?.url, img.url) ?? img.url,
      })),
    };
  }
  if (draft.programsSection?.cards) {
    out.programsSection = {
      ...draft.programsSection,
      cards: draft.programsSection.cards.map((card, i) => ({
        ...card,
        imageUrl:
          preferCustomUrl(prev.programsSection?.cards?.[i]?.imageUrl, card.imageUrl) ?? card.imageUrl,
      })),
    };
  }
  if (draft.upcomingEvents?.items) {
    out.upcomingEvents = {
      ...draft.upcomingEvents,
      items: draft.upcomingEvents.items.map((item, i) => ({
        ...item,
        imageUrl:
          preferCustomUrl(prev.upcomingEvents?.items?.[i]?.imageUrl, item.imageUrl) ?? item.imageUrl,
      })),
    };
  }

  return out as T;
}

/** Deep-merge brand_settings so seed/defaults never wipe landing / center_landing / legal. */
export function mergeBrandSettingsPreserveContent(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>
): Record<string, unknown> {
  const landing = {
    ...((incoming.landing as object) ?? {}),
    ...((existing.landing as object) ?? {}),
  };
  const centerLanding = {
    ...((incoming.center_landing as object) ?? {}),
    ...((existing.center_landing as object) ?? {}),
  };
  const legalPages = {
    ...((incoming.legal_pages as object) ?? {}),
    ...((existing.legal_pages as object) ?? {}),
  };
  return {
    ...incoming,
    ...existing,
    landing: Object.keys(landing).length ? landing : existing.landing ?? incoming.landing,
    center_landing:
      Object.keys(centerLanding).length ? centerLanding : existing.center_landing ?? incoming.center_landing,
    legal_pages: Object.keys(legalPages).length ? legalPages : existing.legal_pages ?? incoming.legal_pages,
  };
}
