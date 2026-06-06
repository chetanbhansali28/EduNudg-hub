import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/homepageDefaults";
import { HomepageEditorForm } from "./HomepageEditorForm";
import { HomepageEditorShell } from "./HomepageEditorShell";

describe("HomepageEditorForm", () => {
  it("regression_sections_use_collapsed_accordions_and_two_column_grid", () => {
    const { container } = render(
      <HomepageEditorShell title="Marketing homepage">
        <HomepageEditorForm config={DEFAULT_HOMEPAGE_CONFIG} onChange={() => undefined} />
      </HomepageEditorShell>
    );

    expect(container.querySelector(".ed-homepage-editor-shell")).toBeTruthy();

    const accordions = container.querySelectorAll("details.ed-editor-accordion");
    expect(accordions.length).toBeGreaterThanOrEqual(8);
    accordions.forEach((el) => {
      expect(el.hasAttribute("open")).toBe(false);
    });

    expect(screen.getByText("Site")).toBeDefined();
    expect(screen.getByText("Navigation")).toBeDefined();
    expect(screen.getByText("Hero")).toBeDefined();
    expect(screen.queryByLabelText("Hero background image URL")).toBeNull();
    expect(screen.getByLabelText("Hero background image or video")).toBeDefined();
  });
});
