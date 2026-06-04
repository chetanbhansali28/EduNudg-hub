import type { HomepageConfig } from "@/types/homepage";

/** Stock placeholders until admins upload assets via the homepage editor. */
const DEFAULT_HERO_IMAGE =
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1920&q=80";
const DEFAULT_PHONE_FRAME =
  "https://images.unsplash.com/photo-1512941937667-90a1b58e7e9c?auto=format&fit=crop&w=828&q=80";
const DEFAULT_HIGHLIGHT_IMAGE =
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80";

export const DEFAULT_HOMEPAGE_CONFIG: HomepageConfig = {
  meta: {
    siteName: "EduNudg",
    fontSans: "Inter",
    fontSerif: "Instrument Serif",
  },
  theme: {
    bgColor: "#000000",
    accent: "#000000",
    muted: "#666666",
    ctaBg: "#000000",
    ctaFg: "#ffffff",
    yellowGlow: "#f5e6a8",
    radiusSection: "48px",
  },
  nav: {
    links: [
      { label: "Features", href: "#features" },
      { label: "FAQ", href: "#faq" },
    ],
    ctaLabel: "Get started",
    ctaHref: "/login",
    adminHref: "/admin/homepage",
  },
  hero: {
    line1: "Learn with",
    line1Serif: "clarity.",
    line2: "Lead with",
    line2Serif: "confidence.",
    subtitle:
      "EduNudg connects franchisors, centers, instructors, and families in one premium learning operating system built for scale.",
    ctaLabel: "Get started",
    ctaHref: "/login",
    backgroundImageUrl: DEFAULT_HERO_IMAGE,
    phoneFrameUrl: DEFAULT_PHONE_FRAME,
  },
  featureSections: [
    {
      id: "organize",
      title: "Just plan.",
      titleSerif: "We'll orchestrate.",
      body: "Say what your network needs. EduNudg structures curriculum, centers, and enrollments in seconds—not spreadsheets.",
    },
    {
      id: "focus",
      title: "Stay out of",
      titleSerif: "your own way.",
      body: "No crowded ERP screens. A calm command center for brand owners and center operators—only what matters today.",
    },
    {
      id: "priorities",
      title: "Prioritise what",
      titleSerif: "actually matters.",
      body: "Royalty rules, center health, and student progress—ranked and visible so leaders act on signal, not noise.",
    },
    {
      id: "reflect",
      title: "See your network",
      titleSerif: "clearly.",
      body: "Executive dashboards and drill-down analytics. Understand enrollment, revenue, and learning outcomes at a glance.",
    },
  ],
  showcaseCards: [
    {
      id: "open",
      title: "Just open and",
      titleItalic: "plan",
      body: "Open EduNudg in the morning and see what your network needs. Curriculum, centers, and enrollments—structured before your first coffee.",
      layout: "image-dark",
      imageUrl: DEFAULT_HIGHLIGHT_IMAGE,
    },
    {
      id: "structure",
      title: "Structure in",
      titleItalic: "seconds",
      body: "EduNudg reads your operations, finds the real priorities, and lays out your day in less time than it takes to pour coffee.",
      layout: "white-phone",
      phoneImageUrl: DEFAULT_PHONE_FRAME,
    },
    {
      id: "three",
      title: "The power of",
      titleItalic: "three",
      body: "Brand, center, and family—three portals, one source of truth. The constraint forces clarity across your franchise network.",
      layout: "image-priorities",
      imageUrl: DEFAULT_HIGHLIGHT_IMAGE,
      priorities: [
        { label: "Curriculum governance", tag: "Brand" },
        { label: "Center operations", tag: "Franchise" },
        { label: "Family transparency", tag: "Parents" },
      ],
    },
    {
      id: "wrist",
      title: "Right from your",
      titleItalic: "dashboard",
      body: "Glance at center health, capture enrollments, and close the loop on fees without ever leaving the command center.",
      layout: "image-watch",
      imageUrl: DEFAULT_HIGHLIGHT_IMAGE,
    },
    {
      id: "weekly",
      title: "A weekly",
      titleItalic: "moment",
      body: "Every week EduNudg surfaces patterns, highlights, and challenges across your network. A moment, not a dashboard.",
      layout: "image-weekly",
      imageUrl: DEFAULT_HIGHLIGHT_IMAGE,
    },
  ],
  privacy: {
    title: "Built for trust.",
    body: "Tenant isolation, row-level security, and audit trails by design. Your franchise data stays scoped to the right brand, center, and role.",
  },
  testimonials: {
    title: "From the first networks.",
    subtitle:
      "Honest reactions from operators using EduNudg in their actual workflows. Before launch. Before the fanfare.",
    items: [
      {
        quote:
          "Finally a platform that fits how our franchise actually runs—not a coaching ERP bolted together.",
        author: "Early User Feedback",
      },
      {
        quote:
          "Center admissions to fees in one flow. Our team stopped juggling five tools.",
        author: "Early User Feedback",
      },
      {
        quote:
          "Three portals, one truth. That one constraint changed our week more than any system we've tried.",
        author: "Early User Feedback",
      },
      {
        quote:
          "It doesn't nag or buzz. It just quietly organises what we need and gives us back the only list we needed.",
        author: "Early User Feedback",
      },
      {
        quote:
          "The weekly rollup has become our favourite two minutes of the day. Quiet, honest, and somehow always encouraging.",
        author: "Early User Feedback",
      },
      {
        quote:
          "I'm ADHD and every planner has failed me. EduNudg is the first one that doesn't expect me to be someone I'm not.",
        author: "Early User Feedback",
      },
    ],
  },
  faq: [
    {
      question: "How is EduNudg different from a coaching ERP?",
      answer:
        "EduNudg is multi-tenant SaaS for franchise networks: brands, centers, curriculum versioning, royalties, and family portals—not a single-center admin tool.",
    },
    {
      question: "Who is EduNudg for?",
      answer:
        "Platform owners, franchisors, franchise centers, instructors, students, and parents—each with their own portal and permissions.",
    },
    {
      question: "Is my data isolated between brands?",
      answer:
        "Yes. Strict tenant isolation with Postgres RLS. Brands cannot see each other's data.",
    },
    {
      question: "Can we use custom domains?",
      answer:
        "Yes. Map brand and center hostnames, with custom domain support on the roadmap.",
    },
  ],
  footerCta: {
    title: "Start your network differently.",
    subtitle: "Clarity for leaders. Continuity for learners.",
    ctaLabel: "Get started",
    ctaHref: "/login",
    backgroundImageUrl: DEFAULT_HERO_IMAGE,
  },
  footer: {
    productLinks: [
      { label: "Get started", href: "/login" },
      { label: "Features", href: "#features" },
      { label: "FAQ", href: "#faq" },
    ],
    companyLinks: [
      { label: "Platform admin", href: "/admin" },
      { label: "Edit homepage", href: "/admin/homepage" },
      { label: "Support", href: "mailto:support@edunudg.com" },
    ],
    connectLinks: [
      { label: "Instagram", href: "https://instagram.com" },
      { label: "LinkedIn", href: "https://linkedin.com" },
      { label: "TikTok", href: "https://tiktok.com" },
    ],
    copyright: "© 2026 EduNudg. All rights reserved.",
    privacyHref: "#",
    termsHref: "#",
  },
};
