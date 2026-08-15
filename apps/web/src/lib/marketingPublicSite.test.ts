import { describe, expect, it, vi } from "vitest";
import { buildBrandLandingConfig, mergeAbacusClassicLandingConfig } from "@/lib/brandLandingDefaults";
import { createPublicCurriculumProgram } from "@/lib/brandCurriculumPublic";
import {
  CURRICULUM_NAV_HREF,
  CUSTOM_NAV_HREF_OPTION,
  PROGRAMS_NAV_HREF,
  isKnownMarketingNavHref,
  marketingNavSectionOptions,
  normalizeMarketingNavHref,
  resolveNavHrefSelectValue,
  scrollToMarketingHash,
  sanitizePublicFooter,
  sanitizePublicFooterLinks,
  syncMarketingNavLinks,
} from "./marketingPublicSite";

describe("syncMarketingNavLinks", () => {
  const sampleCurriculum = [
    createPublicCurriculumProgram({ name: "Core Program", description: "Basics" }),
  ];

  it("regression_novu_injects_curriculum_nav_when_programs_exist", () => {
    const config = buildBrandLandingConfig("Abacus World");
    const next = syncMarketingNavLinks(config, { theme: "novu", publicCurriculum: sampleCurriculum });

    expect(next.nav.links.some((l) => l.href === CURRICULUM_NAV_HREF && l.label === "Curriculum")).toBe(true);
  });

  it("regression_novu_omits_curriculum_nav_when_no_programs", () => {
    const config = syncMarketingNavLinks(buildBrandLandingConfig("Abacus World"), {
      theme: "novu",
      publicCurriculum: sampleCurriculum,
    });
    const cleared = syncMarketingNavLinks(config, { theme: "novu", publicCurriculum: [] });

    expect(cleared.nav.links.some((l) => l.href === CURRICULUM_NAV_HREF)).toBe(false);
  });

  it("regression_abacus_classic_does_not_auto_inject_curriculum_nav", () => {
    const config = mergeAbacusClassicLandingConfig("Smart Brain Abacus");
    const next = syncMarketingNavLinks(config, { theme: "abacus-classic", publicCurriculum: sampleCurriculum });

    expect(next.nav.links.some((l) => l.href === CURRICULUM_NAV_HREF && l.label === "Curriculum")).toBe(false);
    expect(next.nav.links.some((l) => l.href === "#programs" && l.label === "Programs")).toBe(true);
  });

  it("regression_preserves_brand_custom_curriculum_nav_label", () => {
    const config = mergeAbacusClassicLandingConfig("Smart Brain Abacus");
    config.nav.links = [{ label: "Our courses", href: CURRICULUM_NAV_HREF }, ...config.nav.links];
    const next = syncMarketingNavLinks(config, { theme: "abacus-classic", publicCurriculum: sampleCurriculum });

    expect(next.nav.links.some((l) => l.href === CURRICULUM_NAV_HREF && l.label === "Our courses")).toBe(true);
  });

  it("regression_injects_about_us_nav_when_homepage_about_enabled", () => {
    const config = mergeAbacusClassicLandingConfig("Smart Brain Abacus");
    // Remove any default /about link so injection is observable
    config.nav.links = config.nav.links.filter((l) => l.href !== "/about" && l.href !== "#about");
    config.sections = { ...config.sections, about: true };
    const next = syncMarketingNavLinks(config, { theme: "abacus-classic", publicCurriculum: [] });

    expect(next.nav.links.some((l) => l.href === "#about" && l.label === "About Us")).toBe(true);
  });

  it("regression_omits_about_us_nav_when_homepage_about_disabled", () => {
    const config = mergeAbacusClassicLandingConfig("Smart Brain Abacus");
    config.nav.links = config.nav.links.filter((l) => l.href !== "/about" && l.href !== "#about");
    config.sections = { ...config.sections, about: false };
    const next = syncMarketingNavLinks(config, { theme: "abacus-classic", publicCurriculum: [] });

    expect(next.nav.links.some((l) => l.href === "#about" && l.label === "About Us")).toBe(false);
  });
});

describe("marketingNavSectionOptions", () => {
  it("regression_abacus_classic_includes_founders_and_modal_targets", () => {
    const options = marketingNavSectionOptions({ theme: "abacus-classic", portalMode: "brand" });
    const values = options.map((o) => o.value);

    expect(values).toContain("#founders");
    expect(values).toContain("enroll");
    expect(values).toContain(CUSTOM_NAV_HREF_OPTION);
    expect(values).not.toContain("#register");
  });

  it("regression_novu_center_includes_register_not_apply", () => {
    const options = marketingNavSectionOptions({ theme: "novu", portalMode: "center" });
    const values = options.map((o) => o.value);

    expect(values).toContain("#register");
    expect(values).not.toContain("#apply");
  });

  it("regression_spark_academy_includes_journey_section", () => {
    const options = marketingNavSectionOptions({ theme: "spark-academy", portalMode: "brand" });
    expect(options.some((o) => o.value === "#journey")).toBe(true);
  });

  it("regression_spark_nav_dropdown_omits_duplicate_programs_and_about_us", () => {
    const options = marketingNavSectionOptions({ theme: "spark-academy", portalMode: "brand" });
    const values = options.map((o) => o.value);
    const labels = options.map((o) => o.label);

    expect(labels).not.toContain("Programs (#programs)");
    expect(labels).not.toContain("About us (#features)");
    expect(values).not.toContain(CURRICULUM_NAV_HREF);
    expect(values).toContain(PROGRAMS_NAV_HREF);
    expect(values).toContain("#features");
    expect(values).toContain("/about");
    expect(values).toContain("#gallery");
    expect(options.find((o) => o.value === PROGRAMS_NAV_HREF)?.label).toBe("Courses (#programs)");
    expect(options.find((o) => o.value === "#features")?.label).toBe("Features (#features)");
  });
});

describe("normalizeMarketingNavHref", () => {
  it("regression_maps_legacy_founders_section_alias", () => {
    expect(normalizeMarketingNavHref("#FoundersSection")).toBe("#founders");
  });
});

describe("resolveNavHrefSelectValue", () => {
  it("regression_unknown_href_uses_custom_option", () => {
    const options = marketingNavSectionOptions({ theme: "abacus-classic", portalMode: "brand" });
    expect(resolveNavHrefSelectValue("/login", options)).toBe(CUSTOM_NAV_HREF_OPTION);
    expect(resolveNavHrefSelectValue("#founders", options)).toBe("#founders");
  });

  it("regression_legacy_alias_resolves_to_preset_option", () => {
    const options = marketingNavSectionOptions({ theme: "abacus-classic", portalMode: "brand" });
    expect(resolveNavHrefSelectValue("#FoundersSection", options)).toBe("#founders");
  });

  it("regression_spark_curriculum_alias_maps_to_courses_option", () => {
    const options = marketingNavSectionOptions({ theme: "spark-academy", portalMode: "brand" });
    expect(resolveNavHrefSelectValue("#curriculum", options)).toBe("#programs");
    expect(
      isKnownMarketingNavHref("#curriculum", { theme: "spark-academy", portalMode: "brand" })
    ).toBe(true);
  });
});

describe("isKnownMarketingNavHref", () => {
  it("regression_recognizes_preset_after_normalization", () => {
    expect(
      isKnownMarketingNavHref("#FoundersSection", { theme: "abacus-classic", portalMode: "brand" })
    ).toBe(true);
    expect(isKnownMarketingNavHref("/login", { theme: "abacus-classic", portalMode: "brand" })).toBe(false);
  });
});

describe("scrollToMarketingHash", () => {
  it("regression_scrolls_to_hash_target", async () => {
    const target = document.createElement("div");
    target.id = "curriculum";
    target.scrollIntoView = vi.fn();
    document.body.appendChild(target);

    scrollToMarketingHash("#curriculum");
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    target.remove();
  });
});

describe("resolveMarketingSectionHref", () => {
  it("regression_keeps_hash_on_homepage", async () => {
    const { resolveMarketingSectionHref } = await import("./marketingPublicSite");
    expect(resolveMarketingSectionHref("#pricing", "/")).toBe("#pricing");
    expect(resolveMarketingSectionHref("#faq", "")).toBe("#faq");
  });

  it("regression_points_hash_links_at_homepage_from_login", async () => {
    const { resolveMarketingSectionHref } = await import("./marketingPublicSite");
    expect(resolveMarketingSectionHref("#pricing", "/login")).toBe("/#pricing");
    expect(resolveMarketingSectionHref("#features", "/login")).toBe("/#features");
    expect(resolveMarketingSectionHref("/legal/terms", "/login")).toBe("/legal/terms");
  });
});

describe("toYoutubeEmbedUrl", () => {
  it("parses watch URLs", async () => {
    const { toYoutubeEmbedUrl } = await import("./marketingPublicSite");
    expect(toYoutubeEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ"
    );
  });
});

describe("sanitizePublicFooter", () => {
  it("regression_platform_footer_omits_admin_links_in_merge", async () => {
    const { mergeHomepageConfig } = await import("./homepageApi");
    const merged = mergeHomepageConfig({
      footer: {
        productLinks: [{ label: "Sign in", href: "/login" }],
        companyLinks: [
          { label: "Platform admin", href: "/admin" },
          { label: "Edit homepage", href: "/admin/homepage" },
          { label: "Contact", href: "mailto:support@edunudg.com" },
        ],
        connectLinks: [],
        copyright: "© Test",
        privacyHref: "/legal/privacy",
        termsHref: "/legal/terms",
        refundHref: "/legal/refund",
      },
    });

    expect(merged.footer.companyLinks.some((l) => l.href.startsWith("/admin"))).toBe(false);
    expect(merged.footer.companyLinks.some((l) => l.label === "Contact")).toBe(true);
    expect(merged.footer.productLinks.some((l) => l.href === "/login")).toBe(true);
  });

  it("regression_sanitize_public_footer_links_filters_admin_paths", () => {
    const filtered = sanitizePublicFooterLinks([
      { label: "Admin", href: "/admin" },
      { label: "FAQ", href: "#faq" },
    ]);
    expect(filtered).toEqual([{ label: "FAQ", href: "#faq" }]);
  });
});

describe("isLegacyPlatformHomepageSeed", () => {
  it("detects virgin novu seed markers and treats enterprise config as current", async () => {
    const { isLegacyPlatformHomepageSeed } = await import("./homepageApi");
    const { DEFAULT_HOMEPAGE_CONFIG } = await import("./homepageDefaults");

    expect(
      isLegacyPlatformHomepageSeed({
        theme: { bgGradient: "linear-gradient(180deg, #f7f3ec, #e8dfd0)" } as never,
        meta: {
          siteName: "EduNudg",
          fontSans: "Inter",
          fontSerif: "Playfair Display",
          themeNote: "Novu-inspired",
        },
        hero: { line1: "Hello" } as never,
      })
    ).toBe(true);

    expect(isLegacyPlatformHomepageSeed(DEFAULT_HOMEPAGE_CONFIG)).toBe(false);
  });

  it("keeps customized rows that still carry Novu theme markers (assets must not be discarded)", async () => {
    const { isLegacyPlatformHomepageSeed, hasCustomPlatformMarketingMedia } = await import(
      "./homepageApi"
    );

    const customized = {
      theme: { bgGradient: "linear-gradient(180deg, #f7f3ec, #e8dfd0)" } as never,
      meta: {
        siteName: "EduNudg",
        fontSans: "Inter",
        fontSerif: "Playfair Display",
        themeNote: "Novu-inspired",
        logoUrl:
          "https://example.supabase.co/storage/v1/object/public/brand-assets/platform-logo.png",
      },
      hero: {
        backgroundImageUrl:
          "https://example.supabase.co/storage/v1/object/public/brand-assets/platform/marketing/hero-background/asset.jpeg",
      },
      ecosystemIntro: { title: "Connected", subtitle: "Ecosystem" },
      connectivityShowcase: {
        title: "t",
        subtitle: "s",
        centerImageUrl:
          "https://example.supabase.co/storage/v1/object/public/brand-assets/platform/marketing/connectivity-center/asset.jpg",
        cards: [],
      },
      brandSignup: { title: "t", subtitle: "s", steps: [] },
      heroOverlayCard: { eyebrow: "e", value: "v", progressPercent: 1 },
    };

    expect(hasCustomPlatformMarketingMedia(customized as never)).toBe(true);
    expect(isLegacyPlatformHomepageSeed(customized as never)).toBe(false);
  });
});
