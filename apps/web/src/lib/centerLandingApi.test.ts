import { describe, expect, it, vi, beforeEach } from "vitest";
import { fetchCenterLandingBundle } from "./centerLandingApi";

const rpc = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ rpc }),
}));

describe("fetchCenterLandingBundle", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it("regression_uses_center_name_from_db_for_site_name_casing", async () => {
    rpc.mockResolvedValue({
      data: {
        brand_name: "Abacus World",
        brand_slug: "abacusworld",
        center_name: "KORAMANGALA Abacus Center",
        center_slug: "koramangala",
        center_city: "Bengaluru",
        landing: {
          meta: { siteName: "Koramangala" },
        },
        success_stories: [],
        curriculum: [{ name: "Core Program", version_number: 1, levels: [] }],
      },
      error: null,
    });

    const bundle = await fetchCenterLandingBundle("abacusworld", "koramangala");
    expect(bundle?.config.meta.siteName).toBe("KORAMANGALA Abacus Center");
    expect(bundle?.profile.centerName).toBe("KORAMANGALA Abacus Center");
    expect(bundle?.config.nav.links.some((l) => l.href === "#curriculum")).toBe(true);
  });

  it("regression_center_landing_footer_ignores_brand_social_connect", async () => {
    rpc.mockResolvedValue({
      data: {
        brand_name: "Abacus World",
        brand_slug: "abacusworld",
        center_name: "Koramangala Center",
        center_slug: "koramangala",
        center_city: "Bengaluru",
        social_connect: {
          facebookUrl: "https://facebook.com/chetan-bhansali",
          instagramUrl: "https://instagram.com/chetan-bhansali",
        },
        center_social_links: [
          { platform: "Facebook", url: "https://facebook.com/koramangala-center" },
          { platform: "Instagram", url: "https://instagram.com/koramangala-center" },
        ],
        landing: {},
        success_stories: [],
        curriculum: [],
      },
      error: null,
    });

    const bundle = await fetchCenterLandingBundle("abacusworld", "koramangala");
    expect(bundle?.socialConnect.facebookUrl).toBe("https://facebook.com/koramangala-center");
    expect(bundle?.socialConnect.instagramUrl).toBe("https://instagram.com/koramangala-center");
    expect(bundle?.socialConnect.facebookUrl).not.toContain("chetan-bhansali");
  });
});
