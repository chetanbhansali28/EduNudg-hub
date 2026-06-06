import { describe, expect, it } from "vitest";
import { buildBrandLandingConfig } from "./brandLandingDefaults";

describe("buildBrandLandingConfig", () => {
  it("regression_brand_landing_config_two_feature_sections", () => {
    const config = buildBrandLandingConfig("Smart Brain", {
      featureSections: [
        {
          id: "curriculum",
          title: "Curriculum that",
          titleSerif: "parents trust.",
          body: "Structured levels.",
        },
        {
          id: "launch",
          title: "Launch faster",
          titleSerif: "with playbooks.",
          body: "Site selection checklists.",
        },
      ],
    });

    expect(config.featureSections).toHaveLength(2);
    expect(config.featureSections[0]?.title).toBe("Curriculum that");
    expect(config.featureSections[1]?.title).toBe("Launch faster");
  });
});
