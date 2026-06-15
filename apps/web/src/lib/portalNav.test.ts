import { describe, expect, it } from "vitest";
import { brandNavSections, centerNavSections, filterNavByFeatureFlags, platformNavSections, studentBottomNavItems, studentNavSections, BRAND_FEATURE_FLAGS } from "./portalNav";
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
    const analytics = sections.find((s) => s.title === "Features")?.items.find((i) => i.label === "Analytics");
    expect(analytics?.active).toBe(false);
  });

  it("regression_brand_home_active_on_app_root", () => {
    const sections = brandNavSections("/app");
    expect(sections[0]?.items[0]?.active).toBe(true);
    expect(sections[0]?.items[0]?.href).toBe("/app");
  });

  it("regression_platform_revenue_has_no_placeholder_badge", () => {
    const sections = platformNavSections("/admin/revenue");
    const revenue = sections[1]?.items.find((i) => i.label === "Revenue & Usage");
    expect(revenue?.badge).toBeUndefined();
    expect(revenue?.active).toBe(true);
  });

  it("regression_brand_leads_section_groups_franchise_and_student", () => {
    const sections = brandNavSections("/app/leads");
    const leadsSection = sections.find((s) => s.title === "Leads");
    const featuresSection = sections.find((s) => s.title === "Features");

    expect(leadsSection?.items.map((i) => i.label)).toEqual(["Franchise leads", "Student leads"]);
    expect(leadsSection?.items.find((i) => i.href === "/app/leads")?.active).toBe(true);
    expect(leadsSection?.items.find((i) => i.href === "/app/franchise-applications")?.active).toBe(false);

    expect(featuresSection?.items.some((i) => i.href === "/app/leads")).toBe(false);
    expect(featuresSection?.items.some((i) => i.href === "/app/franchise-applications")).toBe(false);
  });

  it("regression_brand_franchise_leads_active_under_leads_section", () => {
    const sections = brandNavSections("/app/franchise-applications");
    const leadsSection = sections.find((s) => s.title === "Leads");
    expect(leadsSection?.items.find((i) => i.label === "Franchise leads")?.active).toBe(true);
  });

  it("center nav uses leads instead of admissions", () => {
    const sections = centerNavSections("/app/leads");
    const leads = sections[1]?.items.find((i) => i.label === "Leads");
    expect(leads?.active).toBe(true);
    expect(sections[1]?.items.some((i) => i.label === "Admissions")).toBe(false);
  });

  it("includes brand success stories nav item", () => {
    const sections = brandNavSections("/app/success-stories");
    const stories = sections.find((s) => s.title === "Features")?.items.find((i) => i.label === "Success stories");
    expect(stories?.href).toBe("/app/success-stories");
    expect(stories?.active).toBe(true);
  });

  it("includes brand marketing pages nav item", () => {
    const sections = brandNavSections("/app/homepage");
    const marketing = sections.find((s) => s.title === "General")?.items.find((i) => i.label === "Homepage");
    expect(marketing?.href).toBe("/app/homepage");
    expect(marketing?.active).toBe(true);
  });

  it("center nav includes merchandise orders", () => {
    const sections = centerNavSections("/app/merchandise");
    const merchandise = sections[1]?.items.find((i) => i.label === "Merchandise");
    expect(merchandise?.href).toBe("/app/merchandise");
  });

  it("center nav includes assessments and reports", () => {
    const sections = centerNavSections("/app/reports");
    const reports = sections[1]?.items.find((i) => i.label === "Reports");
    const assessments = sections[1]?.items.find((i) => i.label === "Assessments");
    expect(reports?.active).toBe(true);
    expect(assessments?.href).toBe("/app/assessments");
  });

  it("center nav includes curriculum for franchise reference", () => {
    const sections = centerNavSections("/app/curriculum");
    const curriculum = sections[1]?.items.find((i) => i.label === "Curriculum");
    expect(curriculum?.href).toBe("/app/curriculum");
    expect(curriculum?.active).toBe(true);
  });

  it("regression_center_nav_excludes_attendance", () => {
    const sections = centerNavSections("/app");
    const features = sections.find((s) => s.title === "Features");
    expect(features?.items.some((i) => i.label === "Attendance")).toBe(false);
    expect(features?.items.some((i) => i.href === "/app/attendance")).toBe(false);
  });

  it("center nav includes campaigns behind flag path", () => {
    const sections = centerNavSections("/app/campaigns");
    const campaigns = sections[1]?.items.find((i) => i.label === "Campaigns");
    expect(campaigns?.href).toBe("/app/campaigns");
  });

  it("regression_filterNav_hides_campaigns_when_flag_off", () => {
    const sections = filterNavByFeatureFlags(
      brandNavSections("/app"),
      { ...FEATURE_FLAG_DEFAULTS, campaigns: false },
      BRAND_FEATURE_FLAGS
    );
    const features = sections.find((s) => s.title === "Features");
    const leads = sections.find((s) => s.title === "Leads");
    expect(features?.items.some((i) => i.href === "/app/campaigns")).toBe(false);
    expect(leads?.items.some((i) => i.href === "/app/leads")).toBe(true);
  });

  it("regression_filterNav_hides_leads_section_when_both_lead_flags_off", () => {
    const sections = filterNavByFeatureFlags(
      brandNavSections("/app"),
      { ...FEATURE_FLAG_DEFAULTS, student_leads: false, franchise_applications: false },
      BRAND_FEATURE_FLAGS
    );
    expect(sections.some((s) => s.title === "Leads")).toBe(false);
  });

  it("student learn nav has dashboard, progress, competitions, activity, and profile", () => {
    const sections = studentNavSections("/progress");
    const main = sections[0]?.items ?? [];
    expect(main.map((i) => i.label)).toEqual([
      "Home",
      "Progress",
      "Events",
      "Activity",
    ]);
    expect(main.find((i) => i.label === "Progress")?.active).toBe(true);
    expect(sections[1]?.items[0]?.label).toBe("Profile");
  });

  it("student bottom nav matches sidebar labels and routes", () => {
    const sections = studentNavSections("/profile");
    const sidebarLabels = sections.flatMap((section) => section.items.map((item) => item.label));
    const bottomItems = studentBottomNavItems("/profile");

    expect(bottomItems.map((i) => i.label)).toEqual(sidebarLabels);
    expect(bottomItems.map((i) => i.href)).toEqual(["/", "/progress", "/competitions", "/activity", "/profile"]);
    expect(bottomItems.find((i) => i.id === "profile")?.active).toBe(true);
  });
});
