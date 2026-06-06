import { describe, expect, it, vi, beforeEach } from "vitest";
import { fetchBrandLandingBundle } from "./brandLandingApi";

const rpc = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ rpc }),
}));

describe("fetchBrandLandingBundle", () => {
  beforeEach(() => {
    rpc.mockReset();
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
});
