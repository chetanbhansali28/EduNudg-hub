import { describe, expect, it } from "vitest";
import {
  parsePlanFeatures,
  planFeaturesFromForm,
  pricingFeatureBullets,
  STARTER_PLAN_FEATURES,
} from "./subscriptionPlanFeatures";

describe("subscriptionPlanFeatures", () => {
  it("parses plan feature json with defaults", () => {
    const features = parsePlanFeatures({
      max_franchise_centers: 5,
      white_labeling: true,
    });
    expect(features.max_franchise_centers).toBe(5);
    expect(features.max_students).toBeNull();
    expect(features.white_labeling).toBe(true);
    expect(features.whatsapp_operations).toBe(false);
  });

  it("builds pricing bullets for homepage cards", () => {
    const bullets = pricingFeatureBullets(STARTER_PLAN_FEATURES);
    expect(bullets[0]).toMatch(/3 franchise centers/);
    expect(bullets[1]).toMatch(/200 students/);
    expect(bullets).toContain("Student leads module");
  });

  it("converts form values to plan features", () => {
    const features = planFeaturesFromForm({
      max_franchise_centers: "10",
      max_students: "",
      white_labeling: "true",
      whatsapp_operations: "false",
      student_leads: "true",
      franchise_applications: "true",
      brand_billing: "true",
      campaigns: "false",
      kits: "false",
      custom_domain: "false",
      priority_support: "false",
    });
    expect(features.max_franchise_centers).toBe(10);
    expect(features.max_students).toBeNull();
    expect(features.white_labeling).toBe(true);
  });
});
