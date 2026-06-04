import { describe, expect, it } from "vitest";
import { brandNavSections, centerNavSections, filterNavByFeatureFlags, platformNavSections, studentNavSections, BRAND_FEATURE_FLAGS } from "./portalNav";
import { FEATURE_FLAG_DEFAULTS } from "@/hooks/useFeatureFlag";

describe("portalNav", () => {
  it("marks platform home active on /admin", () => {
    const sections = platformNavSections("/admin");
    const home = sections[0]?.items[0];
    expect(home?.active).toBe(true);
    expect(home?.label).toBe("Home");
  });

  it("regression_platform_home_inactive_on_admin_brands", () => {
    const sections = platformNavSections("/admin/brands");
    const home = sections[0]?.items[0];
    const brands = sections[1]?.items.find((i) => i.label === "Brands");
    expect(home?.active).toBe(false);
    expect(brands?.active).toBe(true);
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

  it("includes brand student leads and franchise applications", () => {
    const sections = brandNavSections("/app/leads");
    const leads = sections[1]?.items.find((i) => i.label === "Student Leads");
    const franchise = sections[1]?.items.find((i) => i.label === "Franchise Applications");
    expect(leads?.href).toBe("/app/leads");
    expect(leads?.active).toBe(true);
    expect(franchise?.href).toBe("/app/franchise-applications");
  });

  it("center nav uses leads instead of admissions", () => {
    const sections = centerNavSections("/app/leads");
    const leads = sections[1]?.items.find((i) => i.label === "Leads");
    expect(leads?.active).toBe(true);
    expect(sections[1]?.items.some((i) => i.label === "Admissions")).toBe(false);
  });

  it("includes brand success stories nav item", () => {
    const sections = brandNavSections("/app/success-stories");
    const stories = sections[1]?.items.find((i) => i.label === "Success stories");
    expect(stories?.href).toBe("/app/success-stories");
    expect(stories?.active).toBe(true);
  });

  it("includes brand marketing pages nav item", () => {
    const sections = brandNavSections("/app/homepage");
    const marketing = sections[2]?.items.find((i) => i.label === "Marketing pages");
    expect(marketing?.href).toBe("/app/homepage");
    expect(marketing?.active).toBe(true);
  });

  it("center nav includes kit orders", () => {
    const sections = centerNavSections("/app/kits");
    const kits = sections[1]?.items.find((i) => i.label === "Kit orders");
    expect(kits?.href).toBe("/app/kits");
  });

  it("regression_filterNav_hides_campaigns_when_flag_off", () => {
    const sections = filterNavByFeatureFlags(
      brandNavSections("/app"),
      { ...FEATURE_FLAG_DEFAULTS, campaigns: false },
      BRAND_FEATURE_FLAGS
    );
    const features = sections.find((s) => s.title === "Features");
    expect(features?.items.some((i) => i.href === "/app/campaigns")).toBe(false);
    expect(features?.items.some((i) => i.href === "/app/leads")).toBe(true);
  });

  it("student learn nav has dashboard and profile", () => {
    const sections = studentNavSections("/profile");
    expect(sections[0]?.items[0]?.label).toBe("Dashboard");
    expect(sections[1]?.items[0]?.label).toBe("Profile");
    expect(sections[1]?.items[0]?.active).toBe(true);
  });
});
