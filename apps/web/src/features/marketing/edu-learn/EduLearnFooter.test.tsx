import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { mergeEduLearnLandingConfig, mergeSparkAcademyLandingConfig } from "@/lib/brandLandingDefaults";
import { landingConfigToPartial } from "@/lib/brandLandingEditorApi";
import { EduLearnFooter } from "./EduLearnFooter";

describe("EduLearnFooter", () => {
  it("regression_edu_learn_brand_footer_shows_head_office_contact", () => {
    const spark = mergeSparkAcademyLandingConfig("Smart Brain Abacus");
    const config = mergeEduLearnLandingConfig("Smart Brain Abacus", landingConfigToPartial(spark));
    render(
      <MemoryRouter>
        <EduLearnFooter config={config} />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Contact" })).toBeDefined();
    expect(screen.getByText("Head office address")).toBeDefined();
    expect(screen.getByRole("link", { name: "(222) 545-4543" })).toBeDefined();
  });

  it("regression_edu_learn_center_footer_uses_franchise_address_not_brand_hq", () => {
    const spark = mergeSparkAcademyLandingConfig("Smart Brain Abacus");
    const config = mergeEduLearnLandingConfig("Smart Brain Abacus", landingConfigToPartial(spark));
    render(
      <MemoryRouter>
        <EduLearnFooter
          config={config}
          centerContact={{
            addressLines: ["12 Koramangala Main Road", "Bengaluru · KA · 560034"],
            phone: "+918806232153",
          }}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "This center" })).toBeDefined();
    expect(screen.getByText("12 Koramangala Main Road")).toBeDefined();
    expect(screen.getByRole("link", { name: "+918806232153" })).toBeDefined();
    expect(screen.queryByText("Head office address")).toBeNull();
    expect(screen.queryByText("(222) 545-4543")).toBeNull();
  });
});
