import { mergeHomepageConfig } from "@/lib/homepageApi";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/homepageDefaults";
import { withDefaultFeatureVideos } from "@/lib/marketingFeatureSections";
import type { HomepageConfig } from "@/types/homepage";

/** Parent-facing enrollment landing for a center hostname (e.g. koramangala.abacusworld.localhost). */
export function buildCenterLandingConfig(
  centerName: string,
  brandName: string,
  city: string | null,
  partial?: Partial<HomepageConfig>,
  logoUrl?: string | null
): HomepageConfig {
  const base: Partial<HomepageConfig> = {
    meta: {
      siteName: centerName,
      fontSans: "Inter",
      fontSerif: "Instrument Serif",
      logoUrl: logoUrl ?? null,
    },
    nav: {
      links: [
        { label: "Why abacus", href: "#features" },
        { label: "Parent stories", href: "#testimonials" },
        { label: "FAQ", href: "#faq" },
        { label: "Enroll", href: "#enroll" },
      ],
      ctaLabel: "Book a free trial",
      ctaHref: "#enroll",
      adminHref: "/login",
    },
    hero: {
      line1: "Give your child",
      line1Serif: "math superpowers.",
      line2: "Fun abacus classes",
      line2Serif: city ? `in ${city}.` : "near you.",
      subtitle: `${centerName} helps children build speed, focus, and confidence with ${brandName}'s proven abacus program—small batches, caring instructors, and progress you can see every week.`,
      ctaLabel: "Book a free trial",
      ctaHref: "#enroll",
      backgroundImageUrl: DEFAULT_HOMEPAGE_CONFIG.hero.backgroundImageUrl,
      phoneFrameUrl: DEFAULT_HOMEPAGE_CONFIG.hero.phoneFrameUrl,
    },
    featureSections: [
      {
        id: "brain",
        title: "Stronger mental math,",
        titleSerif: "stronger focus.",
        body: "Abacus training activates both sides of the brain—kids visualize numbers, solve faster, and carry that focus into schoolwork.",
      },
      {
        id: "confidence",
        title: "Confidence that",
        titleSerif: "shows up daily.",
        body: "Level-based milestones and friendly competitions help shy learners speak up and proud parents see steady progress.",
      },
      {
        id: "small-batches",
        title: "Small batches,",
        titleSerif: "personal attention.",
        body: "We cap class sizes so every child gets corrections, encouragement, and homework support—not just a seat in the crowd.",
      },
      {
        id: "parents",
        title: "Parents stay",
        titleSerif: "in the loop.",
        body: "Clear progress reports, fee reminders, and class updates—so you always know what your child learned this week.",
      },
    ],
    privacy: {
      title: "Safe, structured learning.",
      body: `${centerName} is part of the ${brandName} network. Student data is protected with tenant isolation and audit trails—your family's information stays with our center.`,
    },
    testimonials: {
      title: "Parents love the progress",
      subtitle: "Families who started with a trial class and stayed for the journey.",
      items: [
        {
          quote:
            "Within two months my daughter was doing mental math faster than me. She actually looks forward to class now.",
          author: "Parent, Grade 3",
        },
        {
          quote: "The teachers are patient and the levels are clear—we always know what skill comes next.",
          author: "Parent, Koramangala",
        },
        {
          quote: "Best decision we made for exam season prep. Confidence went up, stress went down.",
          author: "Parent, Bengaluru",
        },
      ],
    },
    faq: [
      {
        question: "What age can my child start?",
        answer:
          "Most children begin between ages 5 and 12. Book a free trial and our instructor will recommend the right starting level.",
      },
      {
        question: "How long is each class?",
        answer:
          "Typical sessions are 60–90 minutes, once or twice per week, with short practice homework to build habit.",
      },
      {
        question: "Is the trial class really free?",
        answer:
          "Yes—no payment required for the trial. We'll assess your child's level and share batch options that fit your schedule.",
      },
      {
        question: "When does the next batch start?",
        answer:
          "New batches open every few weeks. Submit the form below and we'll call you with the nearest start date and timings.",
      },
    ],
    footerCta: {
      title: "Ready for your child's",
      subtitle: "free trial class? We'll reach out within one business day to confirm a slot.",
      ctaLabel: "Book a free trial",
      ctaHref: "#enroll",
    },
    footer: {
      productLinks: [
        { label: "Why abacus", href: "#features" },
        { label: "FAQ", href: "#faq" },
        { label: "Enroll", href: "#enroll" },
      ],
      companyLinks: [
        { label: "Staff login", href: "/login" },
        { label: "Center dashboard", href: "/app" },
      ],
      connectLinks: [],
      copyright: `© ${new Date().getFullYear()} ${centerName}. Part of ${brandName}.`,
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
