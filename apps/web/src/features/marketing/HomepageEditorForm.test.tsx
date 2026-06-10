import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/homepageDefaults";
import { HomepageEditorForm } from "./HomepageEditorForm";
import { HomepageEditorShell } from "./HomepageEditorShell";

describe("HomepageEditorForm", () => {
  it("regression_sections_use_collapsed_accordions_in_single_column_stack", () => {
    const { container } = render(
      <HomepageEditorShell title="Marketing homepage">
        <HomepageEditorForm config={DEFAULT_HOMEPAGE_CONFIG} onChange={() => undefined} />
      </HomepageEditorShell>
    );

    expect(container.querySelector(".ed-homepage-editor-shell")).toBeTruthy();
    expect(container.querySelector(".ed-homepage-editor")?.className).not.toContain("grid");

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

  it("regression_form_fields_expose_id_and_name_for_autofill", () => {
    const { container } = render(
      <HomepageEditorShell title="Marketing homepage">
        <HomepageEditorForm config={DEFAULT_HOMEPAGE_CONFIG} onChange={() => undefined} />
      </HomepageEditorShell>
    );

    const fields = container.querySelectorAll("input.ed-field__input, select.ed-field__input, textarea.ed-field__input");
    expect(fields.length).toBeGreaterThan(0);
    fields.forEach((field) => {
      expect(field.getAttribute("id") || field.getAttribute("name")).toBeTruthy();
    });
  });
});
