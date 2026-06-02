import { describe, expect, it } from "vitest";
import { brandNavSections, platformNavSections } from "./portalNav";

describe("portalNav", () => {
  it("marks platform home active on /admin", () => {
    const sections = platformNavSections("/admin");
    const home = sections[0]?.items[0];
    expect(home?.active).toBe(true);
    expect(home?.label).toBe("Home");
  });

  it("marks brand analytics inactive on dashboard", () => {
    const sections = brandNavSections("/app");
    const analytics = sections[1]?.items.find((i) => i.label === "Analytics");
    expect(analytics?.active).toBe(false);
  });

  it("regression_brand_home_active_on_app_root", () => {
    const sections = brandNavSections("/app");
    expect(sections[0]?.items[0]?.active).toBe(true);
    expect(sections[0]?.items[0]?.href).toBe("/app");
  });

  it("regression_platform_revenue_badge_matches_fundora_nav", () => {
    const sections = platformNavSections("/admin/revenue");
    const revenue = sections[1]?.items.find((i) => i.label === "Revenue & Usage");
    expect(revenue?.badge).toBe(20);
    expect(revenue?.active).toBe(true);
  });
});
