import { describe, expect, it, vi, beforeEach } from "vitest";
import { fetchBrandLandingBundle, updateBrandMarketingTheme } from "./brandLandingApi";

const rpc = vi.fn();
const fromMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ rpc, from: fromMock }),
}));

describe("fetchBrandLandingBundle", () => {
  beforeEach(() => {
    rpc.mockReset();
    fromMock.mockReset();
  });

  it("regression_merges_published_success_stories_into_testimonials", async () => {
    rpc.mockResolvedValue({
      data: {
        brand_name: "Abacus World",
        landing: {},
        success_stories: [{ quote: "Great support.", author: "Priya · Owner" }],
        curriculum: [],
      },
      error: null,
    });

    const bundle = await fetchBrandLandingBundle("abacusworld");
    expect(bundle?.config.testimonials.items).toEqual([{ quote: "Great support.", author: "Priya · Owner" }]);
    expect(bundle?.publicCurriculum).toEqual([]);
  });

  it("parses curriculum programs from RPC payload", async () => {
    rpc.mockResolvedValue({
      data: {
        brand_name: "Abacus World",
        landing: { meta: { siteName: "wrong case" } },
        success_stories: [],
        curriculum: [
          {
            name: "Core Program",
            description: null,
            version_number: 1,
            levels: [{ name: "Level 1", level_code: "L1", topics_covered: ["Basics"] }],
          },
        ],
      },
      error: null,
    });

    const bundle = await fetchBrandLandingBundle("abacusworld");
    expect(bundle?.publicCurriculum).toHaveLength(1);
    expect(bundle?.publicCurriculum[0]?.levels[0]?.levelCode).toBe("L1");
    expect(bundle?.config.meta.siteName).toBe("Abacus World");
    expect(bundle?.config.nav.links.some((l) => l.href === "#curriculum")).toBe(true);
  });

  it("sprint1_parses_abacus_classic_theme_and_public_stats_from_rpc", async () => {
    rpc.mockResolvedValue({
      data: {
        brand_name: "Smart Brain Abacus",
        marketing_theme: "abacus-classic",
        public_stats: { centers_count: 8, students_count: 1200 },
        landing: {},
        success_stories: [],
        curriculum: [],
      },
      error: null,
    });

    const bundle = await fetchBrandLandingBundle("smart-brain-abacus");
    expect(bundle?.marketingTheme).toBe("abacus-classic");
    expect(bundle?.publicStats).toEqual({ centersCount: 8, studentsCount: 1200 });
    expect(bundle?.config.hero.badge).toBe("FOR AGED 6–14 YEARS");
    expect(bundle?.config.sections?.featureScroll).toBe(false);
  });

  it("sprint1_parses_spark_academy_theme_and_defaults", async () => {
    rpc.mockResolvedValue({
      data: {
        brand_name: "Educat Demo",
        marketing_theme: "spark-academy",
        public_stats: { centers_count: 4, students_count: 800 },
        landing: {},
        success_stories: [],
        curriculum: [],
      },
      error: null,
    });

    const bundle = await fetchBrandLandingBundle("educat-demo");
    expect(bundle?.marketingTheme).toBe("spark-academy");
    expect(bundle?.config.hero.line1).toBe("Shape your future with");
    expect(bundle?.config.sections?.featureScroll).toBe(false);
  });

  it("sprint1_defaults_marketing_theme_when_rpc_omits_theme", async () => {
    rpc.mockResolvedValue({
      data: {
        brand_name: "Abacus World",
        landing: {},
        success_stories: [],
        curriculum: [],
      },
      error: null,
    });

    const bundle = await fetchBrandLandingBundle("abacusworld");
    expect(bundle?.marketingTheme).toBe("novu");
    expect(bundle?.publicStats).toEqual({ centersCount: 0, studentsCount: 0 });
  });
});

describe("updateBrandMarketingTheme", () => {
  beforeEach(() => {
    rpc.mockReset();
    fromMock.mockReset();
  });

  it("sprint1_updates_brands_marketing_theme_via_rpc", async () => {
    rpc.mockResolvedValue({ data: "abacus-classic", error: null });

    await updateBrandMarketingTheme("brand-123", "abacus-classic");

    expect(rpc).toHaveBeenCalledWith("set_brand_marketing_theme", {
      p_brand_id: "brand-123",
      p_theme: "abacus-classic",
    });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("regression_falls_back_to_direct_update_when_rpc_missing", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: "Could not find the function public.set_brand_marketing_theme" },
    });
    const maybeSingle = vi.fn(() =>
      Promise.resolve({ data: { marketing_theme: "spark-academy" }, error: null })
    );
    const select = vi.fn(() => ({ maybeSingle }));
    const eq = vi.fn(() => ({ select }));
    fromMock.mockReturnValue({ update: vi.fn(() => ({ eq })) });

    await updateBrandMarketingTheme("brand-123", "spark-academy");

    expect(fromMock).toHaveBeenCalledWith("brands");
    expect(eq).toHaveBeenCalledWith("id", "brand-123");
  });

  it("sprint1_rejects_invalid_theme", async () => {
    await expect(updateBrandMarketingTheme("brand-123", "invalid" as "novu")).rejects.toThrow(
      "Invalid marketing theme"
    );
  });
});
