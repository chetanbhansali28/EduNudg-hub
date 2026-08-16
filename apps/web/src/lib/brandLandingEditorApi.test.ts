import { describe, expect, it, vi, beforeEach } from "vitest";
import { buildBrandLandingConfig, mergeAbacusClassicLandingConfig, mergeSparkAcademyLandingConfig } from "./brandLandingDefaults";
import {
  fetchBrandMarketingEditor,
  landingConfigToPartial,
  landingPartialFromBrandSettings,
  patchBrandLandingSiteIdentity,
  resolvedBrandSiteLogoUrl,
  saveBrandMarketingLanding,
  siteLogoUrlFromConfig,
  uploadBrandSiteLogo,
} from "./brandLandingEditorApi";

const fromMock = vi.fn();
const uploadBrandLogoMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ from: fromMock }),
}));

vi.mock("@/lib/brandLogoStorage", () => ({
  uploadBrandLogo: (...args: unknown[]) => uploadBrandLogoMock(...args),
}));

function brandsAndSettingsChain(brand: Record<string, unknown>, settings: Record<string, unknown> | null) {
  return (table: string) => {
    if (table === "brands") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: brand, error: null })),
          })),
        })),
      };
    }
    if (table === "brand_settings") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ data: settings, error: null })),
          })),
        })),
      };
    }
    throw new Error(`Unexpected table ${table}`);
  };
}

describe("landingConfigToPartial", () => {
  it("serializes editable homepage sections for brand_settings", () => {
    const config = buildBrandLandingConfig("Abacus World");
    config.hero.line1 = "Custom hero";
    config.faq.push({ question: "New?", answer: "Yes." });

    const partial = landingConfigToPartial(config);

    expect(partial.hero?.line1).toBe("Custom hero");
    expect(partial.meta?.siteName).toBe("Abacus World");
    expect(partial.faq).toHaveLength(config.faq.length);
    expect(partial.featureSections?.length).toBeGreaterThan(0);
    expect(partial.testimonials?.title).toBeTruthy();
  });

  it("regression_brand_landing_partial_includes_nav_links", () => {
    const config = buildBrandLandingConfig("Demo Brand");
    config.nav.links.push({ label: "Pricing", href: "#pricing" });
    const partial = landingConfigToPartial(config);
    expect(partial.nav?.links?.some((l) => l.label === "Pricing")).toBe(true);
  });

  it("regression_brand_landing_partial_includes_section_visibility", () => {
    const config = buildBrandLandingConfig("Demo Brand");
    config.sections = {
      ...config.sections!,
      highlights: false,
      faq: false,
    };
    const partial = landingConfigToPartial(config);
    expect(partial.sections?.highlights).toBe(false);
    expect(partial.sections?.faq).toBe(false);
    expect(partial.sections?.hero).toBe(true);
  });

  it("sprint3_serializes_abacus_classic_sections_for_brand_settings", () => {
    const config = mergeAbacusClassicLandingConfig("Smart Brain Abacus");
    config.founders = [
      {
        roleBadge: "CEO",
        name: "Jane Doe",
        title: "Smart Brain",
        bio: "Bio",
        photoUrl: "",
      },
    ];
    config.gallery = {
      title: "Gallery",
      images: [{ url: "https://example.com/photo.jpg", alt: "Event" }],
    };
    config.trustMedia = {
      eyebrow: "TRUST",
      title: "Why us",
      titleHighlight: "Brand",
      intro: "Intro",
      youtubeUrl: "https://youtu.be/abc12345678",
      cards: [{ title: "Card", subtitle: "Sub", accentColor: "#000" }],
    };
    config.footer.rich = {
      description: "Footer blurb",
      customStats: [{ value: "10+", label: "Centers" }],
      brandStats: { franchiseCount: "10+", studentCount: "1k+" },
    };

    const partial = landingConfigToPartial(config);

    expect(partial.founders).toHaveLength(1);
    expect(partial.gallery?.images).toHaveLength(1);
    expect(partial.trustMedia?.youtubeUrl).toContain("youtu.be");
    expect(partial.footer?.rich?.description).toBe("Footer blurb");
    expect(partial.footer?.rich?.customStats?.[0]?.label).toBe("Centers");
  });

  it("preserves_trust_media_journey_highlight_fields", () => {
    const config = mergeAbacusClassicLandingConfig("Brand");
    config.trustMedia = {
      ...config.trustMedia!,
      imageUrl: "https://cdn.example/journey.jpg",
      highlightLabel: "Raised",
      highlightPrimary: "1000+",
      highlightSecondary: "20+",
      highlightCaption: "Mentors",
    };
    const partial = landingConfigToPartial(config);
    expect(partial.trustMedia?.imageUrl).toBe("https://cdn.example/journey.jpg");
    expect(partial.trustMedia?.highlightLabel).toBe("Raised");
    expect(partial.trustMedia?.highlightPrimary).toBe("1000+");
    expect(partial.trustMedia?.highlightSecondary).toBe("20+");
    expect(partial.trustMedia?.highlightCaption).toBe("Mentors");
  });

  it("preserves_features_showcase_fields", () => {
    const config = mergeSparkAcademyLandingConfig("Brand");
    config.featuresShowcase = {
      imageUrl: "https://cdn.example/features.jpg",
      floatStatsLabel: "Q1",
      floatStatsValue: "10%",
      floatProgressValue: "80%",
    };
    const partial = landingConfigToPartial(config);
    expect(partial.featuresShowcase?.imageUrl).toBe("https://cdn.example/features.jpg");
    expect(partial.featuresShowcase?.floatStatsLabel).toBe("Q1");
    expect(partial.featuresShowcase?.floatProgressValue).toBe("80%");
  });

  it("regression_landing_partial_includes_nav_secondary_ctas_theme_and_abacus_sections", () => {
    const config = mergeAbacusClassicLandingConfig("Smart Brain Abacus");
    config.nav.secondaryCtaLabel = "Partner with us";
    config.nav.secondaryCtaHref = "apply";
    config.theme.accent = "#112233";
    const partial = landingConfigToPartial(config, { marketingTheme: "abacus-classic" });
    expect(partial.nav?.secondaryCtaLabel).toBe("Partner with us");
    expect(partial.nav?.secondaryCtaHref).toBe("apply");
    expect(partial.theme?.accent).toBe("#112233");
    expect(partial.sections?.curriculumSyllabus).toBe(true);
    expect(partial.sections?.featureScroll).toBe(false);
  });
});

describe("fetchBrandMarketingEditor", () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it("sprint1_loads_abacus_classic_landing_config_when_theme_is_abacus_classic", async () => {
    fromMock.mockImplementation(
      brandsAndSettingsChain(
        {
          name: "Smart Brain Abacus",
          slug: "smart-brain-abacus",
          logo_url: null,
          marketing_theme: "abacus-classic",
        },
        { id: "settings-1", settings: {} }
      )
    );

    const editor = await fetchBrandMarketingEditor("brand-1");
    expect(editor.marketingTheme).toBe("abacus-classic");
    expect(editor.landingConfig.hero.badge).toBe("FOR AGED 6–14 YEARS");
    expect(editor.landingConfig.sections?.featureScroll).toBe(false);
    expect(editor.landingConfig.featureSections).toHaveLength(4);
  });

  it("sprint1_loads_novu_landing_config_when_theme_is_novu", async () => {
    fromMock.mockImplementation(
      brandsAndSettingsChain(
        {
          name: "Abacus World",
          slug: "abacusworld",
          logo_url: null,
          marketing_theme: "novu",
        },
        null
      )
    );

    const editor = await fetchBrandMarketingEditor("brand-2");
    expect(editor.marketingTheme).toBe("novu");
    expect(editor.landingConfig.hero.line1).toBe("Own an");
    expect(editor.landingConfig.sections?.featureScroll).toBe(true);
  });

  it("loads legal_pages from brand settings", async () => {
    fromMock.mockImplementation(
      brandsAndSettingsChain(
        {
          name: "Abacus World",
          slug: "abacusworld",
          logo_url: null,
          marketing_theme: "novu",
        },
        {
          id: "settings-1",
          settings: {
            legal_pages: {
              privacy: {
                fileName: "privacy.docx",
                fileUrl: "https://cdn.example/privacy.docx",
                htmlUrl: "https://cdn.example/privacy.html",
                mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                uploadedAt: "2026-01-01",
              },
            },
          },
        }
      )
    );

    const editor = await fetchBrandMarketingEditor("brand-3");
    expect(editor.legalPages.privacy?.fileName).toBe("privacy.docx");
  });

  it("loads social_connect with legacy landing socialLinks migration", async () => {
    fromMock.mockImplementation(
      brandsAndSettingsChain(
        {
          name: "Abacus World",
          slug: "abacusworld",
          logo_url: null,
          marketing_theme: "novu",
        },
        {
          id: "settings-1",
          settings: {
            landing: {
              footer: {
                rich: {
                  socialLinks: [{ platform: "Instagram", url: "https://instagram.com/legacy" }],
                },
              },
            },
          },
        }
      )
    );

    const editor = await fetchBrandMarketingEditor("brand-4");
    expect(editor.socialConnect.instagramUrl).toBe("https://instagram.com/legacy");
  });
});

describe("landingConfigToPartial about", () => {
  it("regression_brand_landing_partial_includes_about", () => {
    const config = mergeAbacusClassicLandingConfig("About Brand");
    const partial = landingConfigToPartial(config, { marketingTheme: "abacus-classic" });
    expect(partial.about?.title).toContain("ABOUT");
    expect(partial.about?.features?.length).toBeGreaterThan(0);
    expect(partial.sections?.about).toBe(false);
  });
});

describe("site logo sync", () => {
  it("siteLogoUrlFromConfig reads homepage Site logo", () => {
    expect(siteLogoUrlFromConfig({ meta: { logoUrl: "  https://cdn.example/site-logo.png  " } } as never)).toBe(
      "https://cdn.example/site-logo.png",
    );
    expect(siteLogoUrlFromConfig({ meta: { logoUrl: "" } } as never)).toBeNull();
  });

  it("regression_save_brand_landing_syncs_site_logo_to_brands_logo_url", async () => {
    const brandUpdate = vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null })),
    }));
    fromMock.mockImplementation((table: string) => {
      if (table === "brand_settings") {
        return {
          update: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
        };
      }
      if (table === "brands") {
        return { update: brandUpdate };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const config = buildBrandLandingConfig("Abacus World");
    config.meta.logoUrl = "https://cdn.example/site-logo.png";

    await saveBrandMarketingLanding("brand-1", "settings-1", {}, "landing", config);

    expect(brandUpdate).toHaveBeenCalledWith({ logo_url: "https://cdn.example/site-logo.png" });
  });

  it("regression_save_center_landing_does_not_overwrite_brand_logo", async () => {
    const brandUpdate = vi.fn(() => Promise.resolve({ error: null }));
    fromMock.mockImplementation((table: string) => {
      if (table === "brand_settings") {
        return {
          update: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
        };
      }
      if (table === "brands") {
        return {
          update: vi.fn(() => ({
            eq: brandUpdate,
          })),
        };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const config = buildBrandLandingConfig("Abacus World");
    config.meta.logoUrl = "https://cdn.example/center-logo.png";
    await saveBrandMarketingLanding("brand-1", "settings-1", {}, "center_landing", config);
    expect(brandUpdate).not.toHaveBeenCalled();
  });
});

describe("platform admin site identity store", () => {
  const landingLogo = "https://cdn.example/storage/v1/object/public/brand-assets/brand-1/logo.png";

  it("landingPartialFromBrandSettings reads stored homepage JSON", () => {
    expect(landingPartialFromBrandSettings({ landing: { hero: { line1: "Hi" } } }).hero?.line1).toBe("Hi");
    expect(landingPartialFromBrandSettings({ features: { merchandise: true } })).toEqual({});
  });

  it("regression_brand_detail_prefers_landing_site_logo_over_brands_logo_url", () => {
    expect(
      resolvedBrandSiteLogoUrl(
        { landing: { meta: { logoUrl: "https://cdn.example/site-logo.png" } } },
        "https://cdn.example/brands-logo.png",
      )
    ).toBe("https://cdn.example/site-logo.png");
    expect(resolvedBrandSiteLogoUrl({}, "https://cdn.example/brands-logo.png")).toBe(
      "https://cdn.example/brands-logo.png",
    );
  });

  it("regression_platform_admin_logo_writes_homepage_landing_meta", async () => {
    const settingsUpdate = vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null })),
    }));
    const brandUpdate = vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null })),
    }));
    fromMock.mockImplementation((table: string) => {
      if (table === "brand_settings") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() =>
                Promise.resolve({
                  data: {
                    id: "settings-1",
                    settings: {
                      features: { merchandise: true },
                      landing: { hero: { line1: "Keep me" }, meta: { siteName: "Old Site" } },
                    },
                  },
                  error: null,
                }),
              ),
            })),
          })),
          update: settingsUpdate,
        };
      }
      if (table === "brands") {
        return { update: brandUpdate };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    await patchBrandLandingSiteIdentity("brand-1", { logoUrl: landingLogo });

    expect(settingsUpdate).toHaveBeenCalledWith({
      settings: {
        features: { merchandise: true },
        landing: {
          hero: { line1: "Keep me" },
          meta: { siteName: "Old Site", logoUrl: landingLogo },
        },
      },
    });
    expect(brandUpdate).toHaveBeenCalledWith({ logo_url: landingLogo });
  });

  it("regression_platform_admin_name_writes_homepage_site_name", async () => {
    const settingsUpdate = vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null })),
    }));
    const brandUpdate = vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null })),
    }));
    fromMock.mockImplementation((table: string) => {
      if (table === "brand_settings") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() =>
                Promise.resolve({
                  data: {
                    id: "settings-1",
                    settings: {
                      features: { student_leads: true },
                      landing: { meta: { logoUrl: landingLogo, siteName: "Old" } },
                    },
                  },
                  error: null,
                }),
              ),
            })),
          })),
          update: settingsUpdate,
        };
      }
      if (table === "brands") {
        return { update: brandUpdate };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    await patchBrandLandingSiteIdentity("brand-1", { siteName: "Smart Brain Abacus" });

    expect(settingsUpdate).toHaveBeenCalledWith({
      settings: {
        features: { student_leads: true },
        landing: { meta: { logoUrl: landingLogo, siteName: "Smart Brain Abacus" } },
      },
    });
    expect(brandUpdate).not.toHaveBeenCalled();
  });

  it("regression_uploadBrandSiteLogo_persists_landing_then_brands_logo_url", async () => {
    uploadBrandLogoMock.mockResolvedValue(`${landingLogo}?v=9`);
    const settingsUpdate = vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null })),
    }));
    const brandUpdate = vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null })),
    }));
    fromMock.mockImplementation((table: string) => {
      if (table === "brand_settings") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() =>
                Promise.resolve({
                  data: { id: "settings-1", settings: { landing: { meta: { siteName: "Brand" } } } },
                  error: null,
                }),
              ),
            })),
          })),
          update: settingsUpdate,
        };
      }
      if (table === "brands") {
        return { update: brandUpdate };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const file = new File(["x"], "logo.png", { type: "image/png" });
    const url = await uploadBrandSiteLogo("brand-1", file);

    expect(url).toBe(`${landingLogo}?v=9`);
    expect(uploadBrandLogoMock).toHaveBeenCalledWith("brand-1", file);
    expect(settingsUpdate).toHaveBeenCalledWith({
      settings: { landing: { meta: { siteName: "Brand", logoUrl: `${landingLogo}?v=9` } } },
    });
    expect(brandUpdate).toHaveBeenCalledWith({ logo_url: `${landingLogo}?v=9` });
  });
});
