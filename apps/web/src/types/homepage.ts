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
}

export interface HomepageFaq {
  question: string;
  answer: string;
}

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
  };
}
