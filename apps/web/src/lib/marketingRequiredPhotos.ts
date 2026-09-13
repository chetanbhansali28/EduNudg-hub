import { isAboutPagePublished } from "@/lib/aboutUs";
import {
  isAbacusSectionEnabled,
  isEduLearnSectionEnabled,
  isSectionEnabled,
  isSparkSectionEnabled,
  type HomepageSectionKey,
} from "@/lib/homepageSections";
import { usesAlternateThemeEditor } from "@/lib/marketingThemeLayout";
import type { PortalMode } from "@/lib/portalMode";
import type { HomepageConfig, MarketingTheme } from "@/types/homepage";

export type RequiredMarketingPhoto = {
  key: string;
  sectionId: string;
  label: string;
  filled: boolean;
};

function hasMediaUrl(value?: string | null): boolean {
  return Boolean(value?.trim());
}

function isSectionOn(config: HomepageConfig, theme: MarketingTheme, key: HomepageSectionKey): boolean {
  if (theme === "spark-academy") return isSparkSectionEnabled(config, key);
  if (theme === "edu-learn") return isEduLearnSectionEnabled(config, key);
  if (theme === "abacus-classic") return isAbacusSectionEnabled(config, key);
  return isSectionEnabled(config, key);
}

/**
 * First photo upload in each homepage / center-site editor section.
 * Extra photos in the same section stay optional.
 */
export function listRequiredMarketingPhotos(input: {
  config: HomepageConfig;
  marketingTheme: MarketingTheme;
  portalMode: PortalMode;
}): RequiredMarketingPhoto[] {
  const { config, marketingTheme, portalMode } = input;
  const alternate = usesAlternateThemeEditor(marketingTheme);
  const photos: RequiredMarketingPhoto[] = [
    {
      key: "site-logo",
      sectionId: "site",
      label: "Site logo",
      filled: hasMediaUrl(config.meta.logoUrl),
    },
  ];

  if (isSectionOn(config, marketingTheme, "hero")) {
    photos.push({
      key: "hero",
      sectionId: "hero",
      label: alternate ? "Hero background" : "Hero background image or video",
      filled: hasMediaUrl(config.hero.backgroundImageUrl),
    });
  }

  if (alternate && marketingTheme === "spark-academy" && isSectionOn(config, marketingTheme, "featureGrid")) {
    photos.push({
      key: "features-image",
      sectionId: "featureGrid",
      label: "Features image",
      filled: hasMediaUrl(config.featuresShowcase?.imageUrl),
    });
  }

  if (isSectionOn(config, marketingTheme, "founders") && (config.founders?.length ?? 0) > 0) {
    photos.push({
      key: "founder-0",
      sectionId: "founders",
      label: "Photo",
      filled: hasMediaUrl(config.founders?.[0]?.photoUrl),
    });
  }

  if (isSectionOn(config, marketingTheme, "upcomingEvents") && (config.upcomingEvents?.items?.length ?? 0) > 0) {
    photos.push({
      key: "event-0",
      sectionId: "upcomingEvents",
      label: "Cover image",
      filled: hasMediaUrl(config.upcomingEvents?.items?.[0]?.imageUrl),
    });
  }

  const aboutInPlay =
    portalMode === "brand" &&
    (isSectionOn(config, marketingTheme, "about") || isAboutPagePublished(config.about));
  const heroOn = isSectionOn(config, marketingTheme, "hero");
  if (aboutInPlay && !heroOn) {
    photos.push({
      key: "about-hero",
      sectionId: "about",
      label: "About Us hero banner image",
      filled: hasMediaUrl(config.about?.heroImageUrl),
    });
  }

  if (alternate && marketingTheme === "spark-academy" && isSectionOn(config, marketingTheme, "trustMedia")) {
    photos.push({
      key: "journey",
      sectionId: "trustMedia",
      label: "Journey highlight image",
      filled: hasMediaUrl(config.trustMedia?.imageUrl),
    });
  }

  if (isSectionOn(config, marketingTheme, "gallery") && (config.gallery?.images?.length ?? 0) > 0) {
    photos.push({
      key: "gallery-0",
      sectionId: "gallery",
      label: "Image",
      filled: hasMediaUrl(config.gallery?.images?.[0]?.url),
    });
  }

  if (!alternate) {
    if ((config.showcaseCards?.length ?? 0) > 0 && isSectionOn(config, marketingTheme, "highlights")) {
      photos.push({
        key: "showcase-0",
        sectionId: "highlights",
        label: "Background image or video",
        filled: hasMediaUrl(config.showcaseCards[0]?.imageUrl),
      });
    }
    photos.push({
      key: "footer-cta",
      sectionId: "privacyFooter",
      label: "Footer CTA background image or video",
      filled: hasMediaUrl(config.footerCta?.backgroundImageUrl),
    });
  }

  return photos;
}

export function isAboutHeroPhotoRequired(input: {
  config: HomepageConfig;
  marketingTheme: MarketingTheme;
  portalMode: PortalMode;
}): boolean {
  return listRequiredMarketingPhotos(input).some((photo) => photo.key === "about-hero");
}

export function missingRequiredMarketingPhotoLabels(input: {
  config: HomepageConfig;
  marketingTheme: MarketingTheme;
  portalMode: PortalMode;
}): string[] {
  return listRequiredMarketingPhotos(input)
    .filter((photo) => !photo.filled)
    .map((photo) => photo.label);
}

export function requiredMarketingPhotosMessage(missing: string[]): string | null {
  if (missing.length === 0) return null;
  return `Upload a photo for: ${missing.join(", ")}.`;
}

export function scrollMarketingEditorToBottom(): void {
  const height = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
  window.scrollTo({ top: height, behavior: "smooth" });
  document
    .querySelector<HTMLElement>("[aria-label='Save changes']")
    ?.scrollIntoView({ behavior: "smooth", block: "end" });
}
