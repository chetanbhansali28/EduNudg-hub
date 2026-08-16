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

  it("regression_center_public_footer_uses_franchise_name_not_sample_center", async () => {
    rpc.mockResolvedValue({
      data: {
        brand_name: "Smart Brain Abacus",
        brand_slug: "smart-brain-abacus",
        marketing_theme: "abacus-classic",
        center_name: "Smart Brain Abacus",
        center_display_name: "Smart Brain Abacus",
        center_slug: "smart-brain-abacus",
        landing: {
          footer: {
            rich: {
              description:
                "Sample Center is a premier education institute delivering abacus, Vedic maths, and handwriting programs.",
            },
          },
        },
        success_stories: [],
        curriculum: [],
      },
      error: null,
    });

    const bundle = await fetchCenterLandingBundle("smart-brain-abacus", "smart-brain-abacus");
    expect(bundle?.config.footer.rich?.description).toContain("Smart Brain Abacus");
    expect(bundle?.config.footer.rich?.description).not.toContain("Sample Center");
    expect(bundle?.config.meta.siteName).toBe("Smart Brain Abacus");
  });

  it("regression_center_landing_footer_uses_brand_social_connect", async () => {
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
          { platform: "YouTube", url: "https://youtube.com/@koramangala" },
        ],
        landing: {},
        success_stories: [],
        curriculum: [],
      },
      error: null,
    });

    const bundle = await fetchCenterLandingBundle("abacusworld", "koramangala");
    expect(bundle?.socialConnect.facebookUrl).toBe("https://facebook.com/chetan-bhansali");
    expect(bundle?.socialConnect.instagramUrl).toBe("https://instagram.com/chetan-bhansali");
    expect(bundle?.socialConnect.facebookUrl).not.toContain("koramangala-center");
    expect(bundle?.socialConnect.youtubeUrl).toBeUndefined();
  });

  it("regression_center_public_programs_filter_to_enabled_curriculum", async () => {
    rpc.mockResolvedValue({
      data: {
        brand_name: "Smart Brain Abacus",
        brand_slug: "smart-brain-abacus",
        marketing_theme: "abacus-classic",
        center_name: "Nilesh Gattani Center",
        center_slug: "nilesh-gattani-center",
        landing: {},
        success_stories: [],
        curriculum: [{ name: "Abacus (Mental Math)", version_number: 1, levels: [] }],
      },
      error: null,
    });

    const bundle = await fetchCenterLandingBundle("smart-brain-abacus", "nilesh-gattani-center");
    expect(bundle?.publicCurriculum.map((row) => row.name)).toEqual(["Abacus (Mental Math)"]);
    expect(bundle?.config.programsSection?.cards?.map((card) => card.name)).toEqual(["Abacus (Mental Math)"]);
  });

  it("regression_center_public_mentors_use_franchiser_then_brand_founder", async () => {
    rpc.mockResolvedValue({
      data: {
        brand_name: "Shree Samarth Smart Brain Abacus",
        brand_slug: "shree-samarth",
        marketing_theme: "spark-academy",
        center_name: "Bhavana Soni",
        center_display_name: "Shree Samarth Smart Brain Abacus",
        center_slug: "en-sma-253",
        center_photo_url: "https://cdn.example/bhavana.jpg",
        landing: {
          founders: [{ name: "Founder name", title: "Sample Center Education Pvt. Ltd.", photoUrl: "", roleBadge: "FOUNDER", bio: "" }],
        },
        brand_founders: [
          {
            name: "Chetan Bhansali",
            title: "Brand owner",
            photoUrl: "https://cdn.example/brand-founder.jpg",
            roleBadge: "FOUNDER & CEO",
            bio: "",
          },
        ],
        success_stories: [],
        curriculum: [],
      },
      error: null,
    });

    const bundle = await fetchCenterLandingBundle("shree-samarth", "en-sma-253");
    expect(bundle?.config.founders?.map((row) => row.name)).toEqual(["Bhavana Soni", "Chetan Bhansali"]);
    expect(bundle?.config.founders?.[0]?.photoUrl).toBe("https://cdn.example/bhavana.jpg");
    expect(bundle?.config.founders?.some((row) => row.name === "Founder name")).toBe(false);
  });

  it("regression_center_public_mentors_brand_owner_first_without_franchiser", async () => {
    rpc.mockResolvedValue({
      data: {
        brand_name: "Shree Samarth Smart Brain Abacus",
        brand_slug: "shree-samarth",
        marketing_theme: "spark-academy",
        center_name: "Shree Samarth Smart Brain Abacus",
        center_display_name: "Shree Samarth Smart Brain Abacus",
        center_slug: "en-sma-253",
        center_photo_url: null,
        landing: {},
        brand_founders: [
          {
            name: "Chetan Bhansali",
            title: "Brand owner",
            photoUrl: "https://cdn.example/brand-founder.jpg",
            roleBadge: "FOUNDER & CEO",
            bio: "",
          },
        ],
        success_stories: [],
        curriculum: [],
      },
      error: null,
    });

    const bundle = await fetchCenterLandingBundle("shree-samarth", "en-sma-253");
    expect(bundle?.config.founders?.map((row) => row.name)).toEqual(["Chetan Bhansali"]);
  });

  it("regression_center_public_mentors_load_brand_owner_from_brand_homepage_rpc", async () => {
    rpc.mockImplementation((fn: string) => {
      if (fn === "get_brand_landing_public") {
        return Promise.resolve({
          data: {
            brand_name: "Shree Samarth Smart Brain Abacus",
            marketing_theme: "spark-academy",
            landing: {
              founders: [
                {
                  name: "Chetan Bhansali",
                  title: "Brand owner",
                  photoUrl: "https://cdn.example/brand-founder.jpg",
                  roleBadge: "FOUNDER & CEO",
                  bio: "",
                },
              ],
            },
          },
          error: null,
        });
      }
      return Promise.resolve({
        data: {
          brand_name: "Shree Samarth Smart Brain Abacus",
          brand_slug: "shree-samarth",
          marketing_theme: "spark-academy",
          center_name: "Bhavana Soni",
          center_display_name: "Shree Samarth Smart Brain Abacus",
          center_slug: "en-sma-253",
          center_photo_url: "https://cdn.example/bhavana.jpg",
          landing: {
            founders: [
              { name: "Founder name", title: "Sample Center Education Pvt. Ltd.", photoUrl: "", roleBadge: "FOUNDER", bio: "" },
            ],
          },
          success_stories: [],
          curriculum: [],
        },
        error: null,
      });
    });

    const bundle = await fetchCenterLandingBundle("shree-samarth", "en-sma-253");
    expect(rpc).toHaveBeenCalledWith("get_brand_landing_public", { p_brand_slug: "shree-samarth" });
    expect(bundle?.config.founders?.map((row) => row.name)).toEqual(["Bhavana Soni", "Chetan Bhansali"]);
  });
});
