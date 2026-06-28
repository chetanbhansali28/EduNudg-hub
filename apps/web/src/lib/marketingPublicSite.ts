import type { HomepageConfig, HomepageLink, MarketingTheme } from "@/types/homepage";
import type { PublicCurriculumProgram } from "@/lib/brandCurriculumPublic";
import type { PortalMode } from "@/lib/portalMode";
import {
  mergeSectionVisibility,
  type HomepageSectionKey,
  type HomepageSectionVisibility,
} from "@/lib/homepageSections";

export const CURRICULUM_NAV_HREF = "#curriculum";
export const PROGRAMS_NAV_HREF = "#programs";
export const CUSTOM_NAV_HREF_OPTION = "__custom__";

export type MarketingNavSectionOption = { value: string; label: string };

type NavOptionDef = MarketingNavSectionOption & {
  sectionKey?: HomepageSectionKey;
};

const LEGACY_NAV_HREF_ALIASES: Record<string, string> = {
  "#founderssection": "#founders",
  "#foundersection": "#founders",
  "#programsection": "#programs",
  "#featuressection": "#features",
  "#faqsection": "#faq",
  "#testimonialssection": "#testimonials",
};

const NOVU_SHARED: NavOptionDef[] = [
  { value: "#features", label: "Features (#features)", sectionKey: "featureScroll" },
  { value: CURRICULUM_NAV_HREF, label: "Curriculum (#curriculum)" },
  { value: "#testimonials", label: "Testimonials (#testimonials)", sectionKey: "testimonials" },
  { value: "#faq", label: "FAQ (#faq)", sectionKey: "faq" },
];

const NOVU_BRAND_OPTIONS: NavOptionDef[] = [
  ...NOVU_SHARED,
  { value: "#apply", label: "Franchise apply (#apply)" },
  { value: "#enroll-student", label: "Student enrollment (#enroll-student)" },
];

const NOVU_CENTER_OPTIONS: NavOptionDef[] = [
  ...NOVU_SHARED,
  { value: "#register", label: "Parent registration (#register)" },
  { value: "#enroll", label: "Book trial (#enroll)" },
];

const NOVU_PLATFORM_OPTIONS: NavOptionDef[] = [
  { value: "#features", label: "Features (#features)", sectionKey: "featureScroll" },
  { value: "#pricing", label: "Pricing (#pricing)" },
  { value: "#testimonials", label: "Testimonials (#testimonials)", sectionKey: "testimonials" },
  { value: "#faq", label: "FAQ (#faq)", sectionKey: "faq" },
];

const ABACUS_CLASSIC_OPTIONS: NavOptionDef[] = [
  { value: PROGRAMS_NAV_HREF, label: "Programs (#programs)", sectionKey: "programsGrid" },
  { value: CURRICULUM_NAV_HREF, label: "Syllabus (#curriculum)", sectionKey: "curriculumSyllabus" },
  { value: "#features", label: "Why us (#features)", sectionKey: "featureGrid" },
  { value: "#founders", label: "Leadership (#founders)", sectionKey: "founders" },
  { value: "#trust", label: "Trust & video (#trust)", sectionKey: "trustMedia" },
  { value: "#testimonials", label: "Success stories (#testimonials)", sectionKey: "testimonials" },
  { value: "#faq", label: "FAQ (#faq)", sectionKey: "faq" },
  { value: "#gallery", label: "Gallery (#gallery)", sectionKey: "gallery" },
  { value: "enroll", label: "Open enroll modal (enroll)" },
  { value: "apply", label: "Open franchise modal (apply)" },
];

const SPARK_ACADEMY_OPTIONS: NavOptionDef[] = [
  { value: PROGRAMS_NAV_HREF, label: "Programs (#programs)", sectionKey: "programsGrid" },
  { value: CURRICULUM_NAV_HREF, label: "Syllabus (#curriculum)", sectionKey: "curriculumSyllabus" },
  { value: "#features", label: "About us (#features)", sectionKey: "featureGrid" },
  { value: "#founders", label: "Mentors (#founders)", sectionKey: "founders" },
  { value: "#journey", label: "Journey stats (#journey)", sectionKey: "trustMedia" },
  { value: "#testimonials", label: "Testimonials (#testimonials)", sectionKey: "testimonials" },
  { value: "#faq", label: "FAQ (#faq)", sectionKey: "faq" },
  { value: "enroll", label: "Open enroll modal (enroll)" },
  { value: "apply", label: "Open franchise modal (apply)" },
];

function baseNavOptionDefs(theme: MarketingTheme, portalMode: PortalMode): NavOptionDef[] {
  if (theme === "abacus-classic") return ABACUS_CLASSIC_OPTIONS;
  if (theme === "spark-academy") return SPARK_ACADEMY_OPTIONS;
  if (portalMode === "center") return NOVU_CENTER_OPTIONS;
  if (portalMode === "brand") return NOVU_BRAND_OPTIONS;
  return NOVU_PLATFORM_OPTIONS;
}

function isSectionOptionVisible(
  option: NavOptionDef,
  sections: Record<HomepageSectionKey, boolean>
): boolean {
  if (!option.sectionKey) return true;
  return sections[option.sectionKey];
}

/** Valid in-page nav targets for the homepage editor Link dropdown (theme + portal aware). */
export function marketingNavSectionOptions(options: {
  theme: MarketingTheme;
  portalMode: PortalMode;
  sections?: HomepageSectionVisibility;
}): MarketingNavSectionOption[] {
  const { theme, portalMode, sections } = options;
  const visibility = mergeSectionVisibility(sections);
  const presets = baseNavOptionDefs(theme, portalMode)
    .filter((option) => isSectionOptionVisible(option, visibility))
    .map(({ value, label }) => ({ value, label }));

  return [...presets, { value: CUSTOM_NAV_HREF_OPTION, label: "Custom link…" }];
}

export function normalizeMarketingNavHref(href: string): string {
  const trimmed = href.trim();
  const alias = LEGACY_NAV_HREF_ALIASES[trimmed.toLowerCase()];
  return alias ?? trimmed;
}

export function isKnownMarketingNavHref(
  href: string,
  options: { theme: MarketingTheme; portalMode: PortalMode; sections?: HomepageSectionVisibility }
): boolean {
  const normalized = normalizeMarketingNavHref(href);
  return marketingNavSectionOptions(options).some(
    (option) => option.value !== CUSTOM_NAV_HREF_OPTION && option.value === normalized
  );
}

export function resolveNavHrefSelectValue(
  href: string,
  options: MarketingNavSectionOption[]
): string {
  const normalized = normalizeMarketingNavHref(href);
  if (options.some((option) => option.value === normalized && option.value !== CUSTOM_NAV_HREF_OPTION)) {
    return normalized;
  }
  return CUSTOM_NAV_HREF_OPTION;
}

const AUTO_CURRICULUM_LABEL = "Curriculum";

function stripAutoInjectedCurriculumLink(links: HomepageConfig["nav"]["links"]) {
  return links.filter((l) => !(l.href === CURRICULUM_NAV_HREF && l.label === AUTO_CURRICULUM_LABEL));
}

function injectNovuCurriculumLink(links: HomepageConfig["nav"]["links"]) {
  if (links.some((l) => l.href === CURRICULUM_NAV_HREF)) {
    return links;
  }
  const featuresIdx = links.findIndex((l) => l.href === "#features");
  const insertAt = featuresIdx >= 0 ? featuresIdx + 1 : 0;
  return [
    ...links.slice(0, insertAt),
    { label: AUTO_CURRICULUM_LABEL, href: CURRICULUM_NAV_HREF },
    ...links.slice(insertAt),
  ];
}

/** Theme-aware nav: Novu injects Curriculum when RPC has programs; alternate themes keep brand-chosen labels. */
export function syncMarketingNavLinks(
  config: HomepageConfig,
  options: { theme: MarketingTheme; publicCurriculum: PublicCurriculumProgram[] }
): HomepageConfig {
  const { theme, publicCurriculum } = options;
  let links = stripAutoInjectedCurriculumLink(config.nav.links);

  if (theme === "novu" && publicCurriculum.length > 0) {
    links = injectNovuCurriculumLink(links);
  }

  return { ...config, nav: { ...config.nav, links } };
}

/** @deprecated Use syncMarketingNavLinks */
export function applyCurriculumNavLink(config: HomepageConfig, hasCurriculum: boolean): HomepageConfig {
  return syncMarketingNavLinks(config, {
    theme: "novu",
    publicCurriculum: hasCurriculum ? [{ name: "_", description: null, whyTake: null, whatYouLearn: null, marketingVideoUrl: null, marketingImageUrl: null, ageLabel: null, marketingBenefits: [], scholarshipHighlight: null, versionNumber: 1, levels: [] }] : [],
  });
}

/** Scroll to in-page section after marketing bundle loads (fixes /#curriculum on async landing). */
export function scrollToMarketingHash(hash: string | undefined): void {
  if (!hash || hash === "#") return;
  const id = decodeURIComponent(hash.replace(/^#/, ""));
  if (!id) return;
  requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

export function applyCanonicalSiteName(config: HomepageConfig, siteName: string): HomepageConfig {
  return {
    ...config,
    meta: { ...config.meta, siteName },
  };
}

/** Admin-only paths that must not appear in public marketing footers. */
export function isAdminOnlyPublicFooterHref(href: string): boolean {
  const normalized = href.trim().toLowerCase();
  if (!normalized.startsWith("/")) return false;
  return normalized === "/admin" || normalized === "/admin/homepage" || normalized.startsWith("/admin/");
}

export function sanitizePublicFooterLinks(links: HomepageLink[]): HomepageLink[] {
  return links.filter((link) => !isAdminOnlyPublicFooterHref(link.href));
}

export function sanitizePublicFooter(config: HomepageConfig["footer"]): HomepageConfig["footer"] {
  return {
    ...config,
    productLinks: sanitizePublicFooterLinks(config.productLinks),
    companyLinks: sanitizePublicFooterLinks(config.companyLinks),
    connectLinks: sanitizePublicFooterLinks(config.connectLinks),
  };
}

/** Converts common YouTube watch/share URLs to embed URL. */
export function toYoutubeEmbedUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1).split("/")[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch") {
        const id = parsed.searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      const embedMatch = parsed.pathname.match(/^\/embed\/([^/?]+)/);
      if (embedMatch?.[1]) return `https://www.youtube.com/embed/${embedMatch[1]}`;
      const shortsMatch = parsed.pathname.match(/^\/shorts\/([^/?]+)/);
      if (shortsMatch?.[1]) return `https://www.youtube.com/embed/${shortsMatch[1]}`;
    }
  } catch {
    return null;
  }

  return null;
}
