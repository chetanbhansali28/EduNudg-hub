import { mergeHomepageConfig } from "@/lib/homepageApi";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/homepageDefaults";
import { withDefaultFeatureVideos } from "@/lib/marketingFeatureSections";
import type { HomepageConfig } from "@/types/homepage";

/** Franchise-recruitment landing defaults for a brand hostname (e.g. abacusworld.localhost). */
export function buildBrandLandingConfig(
  brandName: string,
  partial?: Partial<HomepageConfig>,
  logoUrl?: string | null
): HomepageConfig {
  const base: Partial<HomepageConfig> = {
    meta: {
      siteName: brandName,
      fontSans: "Inter",
      fontSerif: "Instrument Serif",
      logoUrl: logoUrl ?? null,
    },
    nav: {
      links: [
        { label: "Why franchise", href: "#features" },
        { label: "Success stories", href: "#testimonials" },
        { label: "FAQ", href: "#faq" },
        { label: "Apply", href: "#apply" },
      ],
      ctaLabel: "Apply now",
      ctaHref: "#apply",
      adminHref: "/login",
    },
    hero: {
      line1: "Own an",
      line1Serif: `${brandName} center.`,
      line2: "Build a legacy in",
      line2Serif: "your city.",
      subtitle: `Join the ${brandName} franchise network—proven curriculum, center launch playbooks, and technology that keeps operations calm as you scale.`,
      ctaLabel: "Start your application",
      ctaHref: "#apply",
      backgroundImageUrl: DEFAULT_HOMEPAGE_CONFIG.hero.backgroundImageUrl,
      phoneFrameUrl: DEFAULT_HOMEPAGE_CONFIG.hero.phoneFrameUrl,
    },
    featureSections: [
      {
        id: "curriculum",
        title: "Curriculum that",
        titleSerif: "parents trust.",
        body: "Structured levels, assessments, and instructor guides—versioned centrally so every center delivers the same quality.",
      },
      {
        id: "launch",
        title: "Launch faster with",
        titleSerif: "playbooks.",
        body: "Site selection checklists, hiring templates, and marketing kits so your center opens with momentum—not guesswork.",
      },
      {
        id: "ops",
        title: "Operations without",
        titleSerif: "spreadsheet chaos.",
        body: "Admissions, batches, fees, and parent communication in one system built for multi-center franchises.",
      },
      {
        id: "growth",
        title: "Grow with",
        titleSerif: "visibility.",
        body: "Brand dashboards for royalties, center health, and enrollment trends—act on signal, not anecdotes.",
      },
    ],
    privacy: {
      title: "Built for trust.",
      body: `${brandName} runs on EduNudg with tenant isolation, row-level security, and audit trails—your student and financial data stays scoped to your centers.`,
    },
    testimonials: {
      title: "Franchise partners speak",
      subtitle: "Operators who chose the network—and stayed for the support.",
      items: [
        {
          quote: `We opened our first ${brandName} center in under 90 days. The curriculum and ops tooling removed months of trial and error.`,
          author: "Franchise Partner, Bengaluru",
        },
        {
          quote: "Parents see progress clearly; our team spends time teaching, not chasing reports.",
          author: "Center Director",
        },
        {
          quote: "Royalty and enrollment visibility finally match how we actually run the business.",
          author: "Multi-center Operator",
        },
      ],
    },
    faq: [
      {
        question: "What investment is required?",
        answer:
          "Investment varies by city and center format. Submit the form below and our franchise team will share the latest kit, fee structure, and timeline.",
      },
      {
        question: "Do I need prior education industry experience?",
        answer:
          "Many partners come from business backgrounds. We provide instructor training, curriculum, and launch support—you bring local relationships and execution.",
      },
      {
        question: "How long until I can open?",
        answer:
          "Typical partners target 60–120 days from agreement to first cohort, depending on site readiness and hiring.",
      },
      {
        question: "What territories are available?",
        answer:
          "Territories are allocated by city and catchment. Mention your preferred location in the application and we will confirm availability.",
      },
    ],
    footerCta: {
      title: "Ready to bring",
      subtitle: `${brandName} to your community? Tell us about yourself—we respond within two business days.`,
      ctaLabel: "Apply now",
      ctaHref: "#apply",
    },
    footer: {
      productLinks: [
        { label: "Why franchise", href: "#features" },
        { label: "FAQ", href: "#faq" },
        { label: "Apply", href: "#apply" },
      ],
      companyLinks: [
        { label: "Partner login", href: "/login" },
        { label: "Brand portal", href: "/app" },
      ],
      connectLinks: [],
      copyright: `© ${new Date().getFullYear()} ${brandName}. Powered by EduNudg.`,
      privacyHref: "#faq",
      termsHref: "#faq",
    },
    ...partial,
  };

  const merged = mergeHomepageConfig(base);
  return {
    ...merged,
    featureSections: withDefaultFeatureVideos(merged.featureSections),
  };
}
