-- Marketing homepage config (platform_settings) + RLS

CREATE POLICY platform_settings_homepage_public_read ON public.platform_settings
  FOR SELECT TO anon, authenticated
  USING (key = 'marketing_homepage');

CREATE POLICY platform_settings_admin_all ON public.platform_settings
  FOR ALL TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

INSERT INTO public.platform_settings (key, value)
VALUES (
  'marketing_homepage',
  '{
    "meta": {
      "siteName": "EduNudg",
      "fontSans": "DM Sans",
      "fontSerif": "Instrument Serif",
      "themeNote": "Novu-inspired: glassmorphism, warm gradient, Messina→DM Sans, Victor Serif→Instrument Serif"
    },
    "theme": {
      "bgGradient": "linear-gradient(180deg, #f7f3ec 0%, #efe8dc 45%, #e8dfd0 100%)",
      "glassBg": "rgba(255, 255, 255, 0.55)",
      "glassBorder": "rgba(255, 255, 255, 0.65)",
      "accent": "#1a1a1a",
      "muted": "#5c5c5c",
      "ctaBg": "#1a1a1a",
      "ctaFg": "#ffffff"
    },
    "nav": {
      "links": [
        { "label": "Features", "href": "#features" },
        { "label": "FAQ", "href": "#faq" }
      ],
      "ctaLabel": "Get started",
      "ctaHref": "/login",
      "adminHref": "/admin/homepage"
    },
    "hero": {
      "line1": "Learn with clarity.",
      "line2": "Lead with confidence.",
      "subtitle": "EduNudg connects franchisors, centers, instructors, and families in one premium learning operating system built for scale.",
      "ctaPrimary": { "label": "Get started", "href": "/login" },
      "ctaSecondary": { "label": "Platform admin", "href": "/admin" },
      "showDeviceMockup": true
    },
    "featureSections": [
      {
        "id": "organize",
        "title": "Just plan.",
        "titleLine2": "We''ll orchestrate.",
        "body": "Say what your network needs. EduNudg structures curriculum, centers, and enrollments in seconds—not spreadsheets.",
        "imagePosition": "right",
        "bullets": []
      },
      {
        "id": "focus",
        "title": "Stay out of",
        "titleLine2": "the noise.",
        "body": "No crowded ERP screens. A calm command center for brand owners and center operators—only what matters today.",
        "imagePosition": "left",
        "bullets": []
      },
      {
        "id": "priorities",
        "title": "Prioritise what",
        "titleLine2": "actually matters.",
        "body": "Royalty rules, center health, and student progress—ranked and visible so leaders act on signal, not noise.",
        "imagePosition": "right",
        "bullets": [
          { "label": "Curriculum governance", "tag": "Brand" },
          { "label": "Center operations", "tag": "Franchise" },
          { "label": "Family transparency", "tag": "Parents" }
        ]
      },
      {
        "id": "reflect",
        "title": "See your network",
        "titleLine2": "clearly.",
        "body": "Executive dashboards and drill-down analytics. Understand enrollment, revenue, and learning outcomes at a glance.",
        "imagePosition": "left",
        "bullets": []
      }
    ],
    "privacy": {
      "title": "Built for trust.",
      "body": "Tenant isolation, row-level security, and audit trails by design. Your franchise data stays scoped to the right brand, center, and role."
    },
    "testimonials": [
      { "quote": "Finally a platform that fits how our franchise actually runs—not a coaching ERP bolted together.", "author": "Brand Director" },
      { "quote": "Center admissions to fees in one flow. Our team stopped juggling five tools.", "author": "Center Owner" },
      { "quote": "Parents see progress without us chasing reports. Transparency became effortless.", "author": "Franchise Ops" }
    ],
    "faq": [
      { "question": "How is EduNudg different from a coaching ERP?", "answer": "EduNudg is multi-tenant SaaS for franchise networks: brands, centers, curriculum versioning, royalties, and family portals—not a single-center admin tool." },
      { "question": "Who is EduNudg for?", "answer": "Platform owners, franchisors, franchise centers, instructors, students, and parents—each with their own portal and permissions." },
      { "question": "Is my data isolated between brands?", "answer": "Yes. Strict tenant isolation with Postgres RLS. Brands cannot see each other''s data." },
      { "question": "Can we use custom domains?", "answer": "Yes. Map brand and center hostnames, with custom domain support on the roadmap." }
    ],
    "footerCta": {
      "title": "Start your network differently.",
      "subtitle": "Clarity for leaders. Continuity for learners.",
      "ctaLabel": "Get started",
      "ctaHref": "/login"
    },
    "footer": {
      "productLinks": [
        { "label": "Features", "href": "#features" },
        { "label": "FAQ", "href": "#faq" },
        { "label": "Sign in", "href": "/login" }
      ],
      "companyLinks": [
        { "label": "Platform admin", "href": "/admin" },
        { "label": "Edit homepage", "href": "/admin/homepage" }
      ],
      "copyright": "© 2026 EduNudg. All rights reserved."
    }
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;
