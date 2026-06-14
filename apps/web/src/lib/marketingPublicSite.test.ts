import { describe, expect, it, vi } from "vitest";
import { buildBrandLandingConfig, mergeAbacusClassicLandingConfig } from "@/lib/brandLandingDefaults";
import { createPublicCurriculumProgram } from "@/lib/brandCurriculumPublic";
import {
  CURRICULUM_NAV_HREF,
  CUSTOM_NAV_HREF_OPTION,
  isKnownMarketingNavHref,
  marketingNavSectionOptions,
  normalizeMarketingNavHref,
  resolveNavHrefSelectValue,
  scrollToMarketingHash,
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

describe("toYoutubeEmbedUrl", () => {
  it("parses watch URLs", async () => {
    const { toYoutubeEmbedUrl } = await import("./marketingPublicSite");
    expect(toYoutubeEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ"
    );
  });
});
