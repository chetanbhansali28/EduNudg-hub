import { isAboutPagePublished } from "@/lib/aboutUs";
import { BRAND_LEGAL_PAGE_LABELS, parseLegalPageKind, type BrandLegalPageKind } from "@/lib/brandLegalPages";
import type { PublicCurriculumProgram } from "@/lib/brandCurriculumPublic";
import { findPublicCourse, publicCourseSlug } from "@/lib/publicCourseSlug";
import { isBrandAssetsUrl, isStockMarketingUrl } from "@/lib/marketingMediaGuard";
import type { HomepageConfig } from "@/types/homepage";

export type PublicSeoPortal = "platform" | "brand" | "center" | "learn" | "parents";

export type PublicSeoPageKind = "home" | "about" | "course" | "legal" | "login" | "private" | "other";

export type PublicSeoCenter = {
  name: string;
  city?: string | null;
  addressLine1?: string | null;
  phone?: string | null;
  region?: string | null;
  pincode?: string | null;
  shortDescription?: string | null;
};

export type PublicSeoCourse = {
  name: string;
  description?: string | null;
  whyTake?: string | null;
  whatYouLearn?: string | null;
  ageLabel?: string | null;
  imageUrl?: string | null;
};

export type PublicSeoInput = {
  portal: PublicSeoPortal;
  pathname: string;
  requestOrigin: string;
  requestSearch?: string;
  portalBaseDomain?: string;
  isPreview?: boolean;
  brandSlug?: string | null;
  centerSlug?: string | null;
  preferredHostname?: string | null;
  siteName: string;
  brandName?: string | null;
  heroLine?: string | null;
  heroSubtitle?: string | null;
  aboutTitle?: string | null;
  aboutBody?: string | null;
  aboutPublished?: boolean;
  faq?: Array<{ question: string; answer: string }>;
  faqVisible?: boolean;
  logoUrl?: string | null;
  heroImageUrl?: string | null;
  course?: PublicSeoCourse | null;
  legalKind?: BrandLegalPageKind | null;
  legalPublished?: boolean;
  socialSameAs?: string[];
  center?: PublicSeoCenter | null;
};

export type PublicSeoJsonLd = Record<string, unknown>;

export type PublicSeoSnapshot = {
  pageKind: PublicSeoPageKind;
  title: string;
  description: string;
  canonicalUrl: string;
  robots: string;
  indexable: boolean;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string | null;
  ogType: string;
  jsonLd: PublicSeoJsonLd[];
};

const DESCRIPTION_MAX = 155;
const DEFAULT_SITE = "EduNudg";

export function clipSeoDescription(text: string, max = DESCRIPTION_MAX): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  const sliced = normalized.slice(0, max - 1);
  const lastSpace = sliced.lastIndexOf(" ");
  return `${(lastSpace > 80 ? sliced.slice(0, lastSpace) : sliced).trimEnd()}…`;
}

export function classifyPublicPath(pathname: string, portal: PublicSeoPortal): PublicSeoPageKind {
  const path = normalizePathname(pathname);
  if (path.startsWith("/app") || path.startsWith("/admin") || path.startsWith("/auth")) return "private";
  if (path === "/login") return "login";
  if (portal === "learn" || portal === "parents") return "private";
  if (path === "/") return "home";
  if (path === "/about") return portal === "brand" ? "about" : "other";
  if (path.startsWith("/courses/")) return "course";
  if (path.startsWith("/legal/")) return "legal";
  return "other";
}

export function normalizePathname(pathname: string): string {
  const raw = pathname.split("?")[0] ?? "/";
  if (!raw || raw === "/") return "/";
  return raw.replace(/\/+$/, "") || "/";
}

export function isVercelAppHost(hostname: string): boolean {
  return hostname.split(":")[0].toLowerCase().endsWith(".vercel.app");
}

export function originHostname(requestOrigin: string): string {
  try {
    return new URL(requestOrigin).hostname.toLowerCase();
  } catch {
    return "";
  }
}

export function originProtocol(requestOrigin: string): string {
  try {
    return new URL(requestOrigin).protocol.replace(":", "") || "https";
  } catch {
    return "https";
  }
}

function hostWithPort(hostname: string, requestOrigin: string): string {
  try {
    const url = new URL(requestOrigin);
    const port = url.port && url.port !== "80" && url.port !== "443" ? `:${url.port}` : "";
    return `${hostname}${port}`;
  } catch {
    return hostname;
  }
}

/** Preferred public origin (no trailing slash). Query aliases are not preferred when a real host exists. */
export function preferredPublicOrigin(input: Pick<
  PublicSeoInput,
  "portal" | "requestOrigin" | "portalBaseDomain" | "brandSlug" | "centerSlug" | "preferredHostname"
>): string {
  const protocol = originProtocol(input.requestOrigin);
  const requestHost = originHostname(input.requestOrigin);
  const preferred = input.preferredHostname?.trim().toLowerCase().split(":")[0] ?? "";
  const base = input.portalBaseDomain?.trim().toLowerCase().replace(/^\.+|\.+$/g, "") ?? "";
  const brand = input.brandSlug?.trim().toLowerCase() ?? "";
  const center = input.centerSlug?.trim().toLowerCase() ?? "";

  const usablePreferred =
    preferred &&
    !isVercelAppHost(preferred) &&
    preferred !== "localhost" &&
    preferred !== "127.0.0.1" &&
    !preferred.endsWith(".localhost");

  if (usablePreferred) {
    return `${protocol}://${hostWithPort(preferred, input.requestOrigin)}`;
  }

  if (base && !isVercelAppHost(base)) {
    if (input.portal === "center" && brand && center) {
      return `${protocol}://${center}.${brand}.${base}`;
    }
    if ((input.portal === "brand" || input.portal === "learn" || input.portal === "parents") && brand) {
      const prefix = input.portal === "learn" ? "learn." : input.portal === "parents" ? "parents." : "";
      return `${protocol}://${prefix}${brand}.${base}`;
    }
    if (input.portal === "platform") {
      return `${protocol}://${base}`;
    }
  }

  if (requestHost && !isVercelAppHost(requestHost)) {
    return input.requestOrigin.replace(/\/+$/, "");
  }

  return input.requestOrigin.replace(/\/+$/, "");
}

function sameOriginPortalQuery(input: PublicSeoInput): string {
  const host = originHostname(input.requestOrigin);
  const base = input.portalBaseDomain?.trim();
  if (!isVercelAppHost(host) || base) return "";
  if (input.portal === "brand" && input.brandSlug) {
    return `?portal=brand&brand=${encodeURIComponent(input.brandSlug)}`;
  }
  if (input.portal === "center" && input.brandSlug && input.centerSlug) {
    return `?portal=center&brand=${encodeURIComponent(input.brandSlug)}&center=${encodeURIComponent(input.centerSlug)}`;
  }
  return "";
}

export function buildCanonicalUrl(input: PublicSeoInput, pathname = input.pathname): string {
  const origin = preferredPublicOrigin(input);
  const path = normalizePathname(pathname);
  const suffix = path === "/" ? "/" : path;
  return `${origin}${suffix}${sameOriginPortalQuery(input)}`;
}

function pickOgImage(input: PublicSeoInput): string | null {
  const candidates = [input.course?.imageUrl, input.logoUrl, input.heroImageUrl];
  for (const url of candidates) {
    const trimmed = url?.trim() ?? "";
    if (!trimmed) continue;
    if (isStockMarketingUrl(trimmed)) continue;
    if (isBrandAssetsUrl(trimmed) || trimmed.startsWith("https://")) return trimmed;
  }
  return null;
}

function pageTitle(input: PublicSeoInput, kind: PublicSeoPageKind): string {
  const site = input.siteName.trim() || DEFAULT_SITE;
  if (kind === "home") {
    if (input.portal === "center") {
      const brand = (input.brandName ?? site).trim();
      const city = input.center?.city?.trim();
      const centerName = input.center?.name?.trim();
      if (city) return `${brand} in ${city}${centerName ? ` | ${centerName}` : ""}`;
      if (centerName && centerName !== brand) return `${centerName} | ${brand}`;
    }
    const line = input.heroLine?.trim();
    return line ? `${line} | ${site}` : site;
  }
  if (kind === "about") return `About | ${site}`;
  if (kind === "course") return `${input.course?.name?.trim() || "Course"} | ${site}`;
  if (kind === "legal") {
    const label = input.legalKind ? BRAND_LEGAL_PAGE_LABELS[input.legalKind] : "Legal";
    return `${label} | ${site}`;
  }
  return site;
}

function pageDescription(input: PublicSeoInput, kind: PublicSeoPageKind): string {
  const city = input.center?.city?.trim();
  const centerBlurb = input.center?.shortDescription?.trim();
  if (kind === "home") {
    if (input.portal === "center") {
      const localized = centerBlurb
        ? centerBlurb
        : city
          ? `${input.brandName ?? input.siteName} programs in ${city}.`
          : "";
      return clipSeoDescription(localized || input.heroSubtitle || `${input.siteName} learning programs.`);
    }
    return clipSeoDescription(input.heroSubtitle || `${input.siteName} — franchise learning programs.`);
  }
  if (kind === "about") {
    return clipSeoDescription(input.aboutBody || input.aboutTitle || `About ${input.siteName}`);
  }
  if (kind === "course") {
    return clipSeoDescription(
      input.course?.description || input.course?.whyTake || `${input.course?.name ?? "Course"} at ${input.siteName}`
    );
  }
  if (kind === "legal" && input.legalKind) {
    return clipSeoDescription(`${BRAND_LEGAL_PAGE_LABELS[input.legalKind]} for ${input.siteName}.`);
  }
  return clipSeoDescription(input.heroSubtitle || `${input.siteName} learning programs.`);
}

function isIndexable(input: PublicSeoInput, kind: PublicSeoPageKind): boolean {
  if (input.isPreview) return false;
  if (kind === "login" || kind === "private" || kind === "other") return false;
  if (kind === "about" && input.aboutPublished === false) return false;
  if (kind === "legal" && input.legalPublished === false) return false;
  if (kind === "course" && !input.course?.name?.trim()) return false;
  return true;
}

function breadcrumbList(input: PublicSeoInput, kind: PublicSeoPageKind): PublicSeoJsonLd | null {
  const home = buildCanonicalUrl(input, "/");
  const items: Array<{ "@type": "ListItem"; position: number; name: string; item: string }> = [
    { "@type": "ListItem", position: 1, name: input.siteName, item: home },
  ];
  if (kind === "about") {
    items.push({ "@type": "ListItem", position: 2, name: "About", item: buildCanonicalUrl(input, "/about") });
  } else if (kind === "course" && input.course?.name) {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: input.course.name,
      item: buildCanonicalUrl(input),
    });
  } else if (kind === "legal" && input.legalKind) {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: BRAND_LEGAL_PAGE_LABELS[input.legalKind],
      item: buildCanonicalUrl(input),
    });
  } else {
    return null;
  }
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items };
}

function organizationJsonLd(input: PublicSeoInput): PublicSeoJsonLd {
  const origin = preferredPublicOrigin(input);
  const sameAs = (input.socialSameAs ?? []).filter(Boolean);
  if (input.portal === "center" && input.center) {
    const address: Record<string, unknown> = {
      "@type": "PostalAddress",
      addressLocality: input.center.city ?? undefined,
      addressRegion: input.center.region ?? undefined,
      postalCode: input.center.pincode ?? undefined,
      streetAddress: input.center.addressLine1 ?? undefined,
      addressCountry: "IN",
    };
    return {
      "@context": "https://schema.org",
      "@type": "EducationalOrganization",
      name: input.center.name || input.siteName,
      url: buildCanonicalUrl(input, "/"),
      parentOrganization: input.brandName ? { "@type": "Organization", name: input.brandName } : undefined,
      telephone: input.center.phone ?? undefined,
      address,
      image: pickOgImage(input) ?? undefined,
      sameAs: sameAs.length ? sameAs : undefined,
    };
  }
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: input.siteName,
    url: `${origin}/`,
    logo: input.logoUrl && isBrandAssetsUrl(input.logoUrl) ? input.logoUrl : undefined,
    sameAs: sameAs.length ? sameAs : undefined,
  };
}

function websiteJsonLd(input: PublicSeoInput): PublicSeoJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: input.siteName,
    url: buildCanonicalUrl(input, "/"),
  };
}

function faqJsonLd(input: PublicSeoInput): PublicSeoJsonLd | null {
  if (input.faqVisible === false) return null;
  const items = (input.faq ?? []).filter((item) => item.question.trim() && item.answer.trim());
  if (items.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question.trim(),
      acceptedAnswer: { "@type": "Answer", text: item.answer.trim() },
    })),
  };
}

function courseJsonLd(input: PublicSeoInput): PublicSeoJsonLd | null {
  if (!input.course?.name?.trim()) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: input.course.name.trim(),
    description: clipSeoDescription(
      input.course.description || input.course.whyTake || input.course.name,
      300
    ),
    provider: { "@type": "Organization", name: input.brandName || input.siteName },
    image: input.course.imageUrl && !isStockMarketingUrl(input.course.imageUrl) ? input.course.imageUrl : undefined,
    educationalLevel: input.course.ageLabel || undefined,
    teaches: input.course.whatYouLearn || undefined,
  };
}

export function derivePublicSeo(input: PublicSeoInput): PublicSeoSnapshot {
  const pageKind = classifyPublicPath(input.pathname, input.portal);
  const legalKind = input.legalKind ?? parseLegalPageKind(normalizePathname(input.pathname).split("/")[2]);
  const resolved: PublicSeoInput = { ...input, legalKind };
  const indexable = isIndexable(resolved, pageKind);
  const title = pageTitle(resolved, pageKind);
  const description = pageDescription(resolved, pageKind);
  const jsonLd: PublicSeoJsonLd[] = [];

  if (indexable) {
    jsonLd.push(websiteJsonLd(resolved), organizationJsonLd(resolved));
    const crumbs = breadcrumbList(resolved, pageKind);
    if (crumbs) jsonLd.push(crumbs);
    if (pageKind === "home" || pageKind === "about") {
      const faq = faqJsonLd(resolved);
      if (faq) jsonLd.push(faq);
    }
    if (pageKind === "course") {
      const course = courseJsonLd(resolved);
      if (course) jsonLd.push(course);
    }
  }

  return {
    pageKind,
    title,
    description,
    canonicalUrl: buildCanonicalUrl(resolved),
    robots: indexable ? "index, follow" : "noindex, nofollow",
    indexable,
    ogTitle: title,
    ogDescription: description,
    ogImageUrl: pickOgImage(resolved),
    ogType: pageKind === "course" ? "article" : "website",
    jsonLd,
  };
}

export function socialSameAsUrls(connect: {
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  linkedinUrl?: string;
  xUrl?: string;
}): string[] {
  return [connect.facebookUrl, connect.instagramUrl, connect.youtubeUrl, connect.linkedinUrl, connect.xUrl].filter(
    (url): url is string => Boolean(url?.trim())
  );
}

export function courseFromProgram(program: PublicCurriculumProgram | undefined): PublicSeoCourse | null {
  if (!program?.name.trim()) return null;
  return {
    name: program.name,
    description: program.description,
    whyTake: program.whyTake,
    whatYouLearn: program.whatYouLearn,
    ageLabel: program.ageLabel,
    imageUrl: program.marketingImageUrl,
  };
}

export function seoInputFromHomepage(config: HomepageConfig, extras: Partial<PublicSeoInput> = {}): Partial<PublicSeoInput> {
  const heroLine = [config.hero?.line1, config.hero?.line1Serif].filter(Boolean).join(" ").trim();
  const faq = (config.faq ?? []).map((item) => ({ question: item.question, answer: item.answer }));
  return {
    siteName: config.meta?.siteName?.trim() || extras.siteName || DEFAULT_SITE,
    heroLine: heroLine || null,
    heroSubtitle: config.hero?.subtitle?.trim() || null,
    aboutTitle: config.about?.title?.trim() || null,
    aboutBody: config.about?.body?.trim() || config.about?.heroSubtitle?.trim() || null,
    aboutPublished: isAboutPagePublished(config.about),
    faq,
    faqVisible: config.sections?.faq !== false && faq.length > 0,
    logoUrl: config.meta?.logoUrl ?? null,
    heroImageUrl: config.hero?.backgroundImageUrl ?? null,
    ...extras,
  };
}

export function publishedCourseSitemapPaths(programs: PublicCurriculumProgram[]): string[] {
  return programs
    .filter((program) => program.name.trim())
    .map((program) => `/courses/${publicCourseSlug(program, programs)}`);
}

export function courseForPath(programs: PublicCurriculumProgram[], pathname: string): PublicSeoCourse | null {
  const slug = normalizePathname(pathname).split("/")[2] ?? "";
  return courseFromProgram(findPublicCourse(programs, slug));
}
