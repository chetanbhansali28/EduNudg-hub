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
});
