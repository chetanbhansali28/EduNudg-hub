import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { mergeSparkAcademyLandingConfig } from "@/lib/brandLandingDefaults";
import { AboutUsEditorFields } from "./AboutUsEditorFields";

describe("AboutUsEditorFields", () => {
  it("regression_about_editor_includes_hero_and_philosophy_image_uploads", () => {
    const config = mergeSparkAcademyLandingConfig("Spark Brand");
    render(
      <AboutUsEditorFields
        config={config}
        onChange={() => undefined}
        commit={() => undefined}
        commitMedia={() => undefined}
        uploadScope={{ kind: "brand", brandId: "brand-1" }}
      />
    );
    expect(screen.getByText("Hero banner image")).toBeDefined();
    expect(screen.getByText("Philosophy image")).toBeDefined();
    expect(screen.getByText("Story / differentiators image")).toBeDefined();
  });
});
