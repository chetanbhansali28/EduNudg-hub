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
  /** When set, these cards render instead of brand curriculum programs. */
  cards?: HomepageProgramCard[];
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
    /** Brand/center logo for marketing nav (from `brands.logo_url` or platform settings). */
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
    rich?: HomepageRichFooter;
  };
  /** Abacus Classic theme sections (ignored by Novu layout). */
  founders?: HomepageFounderProfile[];
  trustMedia?: HomepageTrustMedia;
  gallery?: HomepageGallery;
  programsSection?: HomepageProgramsSection;
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
