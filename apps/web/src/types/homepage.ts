export interface HomepageLink {
  label: string;
  href: string;
}

export interface HomepageCta {
  label: string;
  href: string;
}

export interface HomepageFeatureSection {
  id: string;
  title: string;
  titleSerif: string;
  body: string;
  videoUrl?: string;
  /** Platform enterprise theme: preset icon keys for card header. */
  iconKeys?: string[];
}

/** Spark Academy “Why us” showcase: left visual + overlay stats on the features section. */
export interface HomepageFeaturesShowcase {
  imageUrl?: string;
  floatStatsLabel?: string;
  floatStatsValue?: string;
  floatStatsAction?: string;
  floatProgressLabel?: string;
  floatProgressValue?: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}

export interface HomepageHeroOverlayCard {
  eyebrow: string;
  value: string;
  progressPercent: number;
}

export interface HomepageEcosystemIntro {
  title: string;
  subtitle: string;
}

export interface HomepageConnectivityCard {
  id: string;
  iconKey: string;
  title: string;
  body: string;
}

export interface HomepageConnectivityShowcase {
  title: string;
  subtitle: string;
  centerImageUrl?: string;
  cards: HomepageConnectivityCard[];
}

export interface HomepageBrandSignupCopy {
  promoTitle: string;
  promoSubtitle: string;
  /** Optional image shown below promo title/subtitle on the public homepage. */
  promoImageUrl?: string;
  steps: [string, string, string];
  formTitle: string;
  formSubtitle: string;
  submitLabel: string;
}

export interface HomepagePriorityItem {
  label: string;
  tag: string;
}

export interface HomepageShowcaseCard {
  id: string;
  title: string;
  titleItalic: string;
  body: string;
  layout: "image-dark" | "white-phone" | "image-priorities" | "image-watch" | "image-weekly";
  imageUrl?: string;
  phoneImageUrl?: string;
  priorities?: HomepagePriorityItem[];
}

export interface HomepageTestimonial {
  quote: string;
  author: string;
  role?: string;
  avatarUrl?: string;
}

export interface HomepageFaq {
  question: string;
  answer: string;
}

export interface HomepageFounderProfile {
  roleBadge: string;
  name: string;
  title: string;
  bio: string;
  photoUrl: string;
  statBadge?: { value: string; label: string };
}

export interface HomepageTrustCard {
  title: string;
  subtitle: string;
  accentColor?: string;
}

export interface HomepageTrustMedia {
  eyebrow?: string;
  title: string;
  titleHighlight?: string;
  intro: string;
  youtubeUrl: string;
  cards: HomepageTrustCard[];
  ctaLabel?: string;
  ctaHref?: string;
  /** Journey highlight photo (Spark Academy). Falls back to first founder photo when empty. */
  imageUrl?: string;
  /** Journey highlight card label, e.g. "Our Investment Fund Raised". */
  highlightLabel?: string;
  /** Large primary figure on the journey highlight card. */
  highlightPrimary?: string;
  /** Secondary figure on the journey highlight card. */
  highlightSecondary?: string;
  /** Caption under the secondary figure. */
  highlightCaption?: string;
}

export interface HomepageGalleryImage {
  url: string;
  alt?: string;
}

export interface HomepageGallery {
  title?: string;
  images: HomepageGalleryImage[];
}

/** Single program card in the Abacus Classic programs grid (homepage editor). */
export interface HomepageProgramCard {
  id: string;
  name: string;
  description?: string;
  /** Optional modal intro (why parents choose this). */
  intro?: string;
  ageLabel?: string;
  imageUrl?: string;
  benefits?: string[];
  scholarshipHighlight?: string;
}

/** Abacus Classic programs grid section headings and brand-wide scholarship default. */
export interface HomepageProgramsSection {
  eyebrow?: string;
  title?: string;
  defaultScholarshipHighlight?: string;
  /** When set, these cards render instead of brand curriculum programs on Abacus Classic.
   *  Spark Academy prefers published curriculum; cards are fallback only. */
  cards?: HomepageProgramCard[];
}

/** Public marketing upcoming event card (competitions, workshops, demos, other). */
export type HomepageEventType = "competition" | "workshop" | "demo" | "other";

export interface HomepageUpcomingEvent {
  type: HomepageEventType;
  title: string;
  description?: string;
  /** ISO date YYYY-MM-DD (required for public visibility). */
  startDate: string;
  /** Optional end date YYYY-MM-DD for multi-day events. */
  endDate?: string;
  /** Start time display, e.g. "10:00 AM". */
  startTime?: string;
  /** End time display, e.g. "1:00 PM". */
  endTime?: string;
  /** Free-text duration, e.g. "2 hours" or "Full day". */
  duration?: string;
  location?: string;
  /** Optional cover image (brand-assets upload). */
  imageUrl?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export interface HomepageUpcomingEventsSection {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  /** Cap how many upcoming items render (omit or 0 = show all upcoming). */
  maxItems?: number;
  items: HomepageUpcomingEvent[];
}

/** Key differentiator on the brand About Us page / homepage teaser. */
export interface HomepageAboutFeature {
  id: string;
  title: string;
  body: string;
}

/** Team member on the brand About Us page (photo grid). */
export interface HomepageAboutMember {
  id: string;
  name: string;
  role: string;
  photoUrl: string;
  /** Optional; not shown on the team grid (full bios stay on Leadership). */
  bio?: string;
}

/**
 * Brand About Us content (theme-aware layout: Novu, Abacus Classic, Spark Academy).
 * Stored in `brand_settings.settings.landing.about`. Homepage visibility uses `sections.about`.
 */
export interface HomepageAboutSection {
  heroHeadline?: string;
  heroSubtitle?: string;
  title?: string;
  body?: string;
  imageUrl?: string;
  philosophyTitle?: string;
  philosophyBody?: string;
  differentTitle?: string;
  features: HomepageAboutFeature[];
  whatWeDoTitle?: string;
  whatWeDoBody?: string;
  teamTitle?: string;
  members: HomepageAboutMember[];
  /** When false, public `/about` redirects home. Default true when omitted. */
  publishPage?: boolean;
  ctaEyebrow?: string;
  onlineCtaTitle?: string;
  onlineCtaBody?: string;
  onlineCtaLabel?: string;
  onlineCtaHref?: string;
  franchiseCtaTitle?: string;
  franchiseCtaBody?: string;
  franchiseCtaLabel?: string;
  franchiseCtaHref?: string;
}

export interface HomepageFooterStat {
  value: string;
  label: string;
}

export interface HomepageFooterPresence {
  region: string;
  cities: string[];
}

export interface HomepageFooterSocial {
  platform: string;
  url: string;
}

export interface HomepageBrandStats {
  franchiseCount?: string;
  studentCount?: string;
}

export interface HomepageRichFooter {
  description?: string;
  badges?: { label: string }[];
  customStats?: HomepageFooterStat[];
  /** @deprecated Ignored — use brandStats instead of live DB counts. */
  showLiveStats?: boolean;
  brandStats?: HomepageBrandStats;
  presence?: HomepageFooterPresence[];
  headOffice?: { address: string; phone: string; website: string };
  socialLinks?: HomepageFooterSocial[];
}

import type { HomepageSectionVisibility } from "@/lib/homepageSections";

export type { HomepageSectionKey, HomepageSectionVisibility } from "@/lib/homepageSections";

export interface HomepageConfig {
  meta: {
    siteName: string;
    fontSans: string;
    fontSerif: string;
    themeNote?: string;
    /** Brand/center logo for marketing nav (homepage Site logo / `landing.meta.logoUrl`). */
    logoUrl?: string | null;
  };
  theme: {
    bgColor: string;
    accent: string;
    muted: string;
    ctaBg: string;
    ctaFg: string;
    yellowGlow: string;
    radiusSection: string;
  };
  nav: {
    links: HomepageLink[];
    ctaLabel: string;
    ctaHref: string;
    secondaryCtaLabel?: string;
    secondaryCtaHref?: string;
    adminHref: string;
  };
  hero: {
    line1: string;
    line1Serif: string;
    line2: string;
    line2Serif: string;
    subtitle: string;
    ctaLabel: string;
    ctaHref: string;
    secondaryCtaLabel?: string;
    secondaryCtaHref?: string;
    badge?: string;
    backgroundImageUrl: string;
    phoneFrameUrl: string;
  };
  featureSections: HomepageFeatureSection[];
  /** Spark Academy features section header + left visual overlays. */
  featuresShowcase?: HomepageFeaturesShowcase;
  showcaseCards: HomepageShowcaseCard[];
  privacy: { title: string; body: string };
  testimonials: {
    title: string;
    subtitle: string;
    items: HomepageTestimonial[];
  };
  faq: HomepageFaq[];
  footerCta: {
    title: string;
    subtitle: string;
    ctaLabel: string;
    ctaHref: string;
    backgroundImageUrl?: string;
  };
  footer: {
    productLinks: HomepageLink[];
    companyLinks: HomepageLink[];
    connectLinks: HomepageLink[];
    copyright: string;
    privacyHref: string;
    termsHref: string;
    refundHref: string;
    rich?: HomepageRichFooter;
  };
  /** Abacus Classic theme sections (ignored by Novu layout). */
  founders?: HomepageFounderProfile[];
  trustMedia?: HomepageTrustMedia;
  gallery?: HomepageGallery;
  programsSection?: HomepageProgramsSection;
  /** Upcoming events (all themes) — competitions, workshops, demos, other. */
  upcomingEvents?: HomepageUpcomingEventsSection;
  /** Brand About Us — `/about`; Novu/Abacus may also show homepage `#about`. Spark is `/about` only. */
  about?: HomepageAboutSection;
  /** Platform enterprise landing: hero stat overlay on side image. */
  heroOverlayCard?: HomepageHeroOverlayCard;
  /** Platform enterprise landing: cream intro band below hero. */
  ecosystemIntro?: HomepageEcosystemIntro;
  /** Platform enterprise landing: phone + satellite cards section. */
  connectivityShowcase?: HomepageConnectivityShowcase;
  /** Platform enterprise landing: brand signup section copy. */
  brandSignup?: HomepageBrandSignupCopy;
  /** Show/hide major page sections on the public marketing site. */
  sections?: HomepageSectionVisibility;
}

/** Platform-assigned public marketing layout (see brands.marketing_theme). */
export const MARKETING_THEMES = ["novu", "abacus-classic", "spark-academy"] as const;
export type MarketingTheme = (typeof MARKETING_THEMES)[number];

export const MARKETING_THEME_LABELS: Record<MarketingTheme, string> = {
  novu: "Novu (default)",
  "abacus-classic": "Abacus Classic",
  "spark-academy": "Spark Academy",
};

export function parseMarketingTheme(value: unknown): MarketingTheme {
  if (value === "abacus-classic") return "abacus-classic";
  if (value === "spark-academy") return "spark-academy";
  return "novu";
}
