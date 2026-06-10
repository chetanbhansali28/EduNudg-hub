import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/homepageDefaults";
import { HomepageEditorForm } from "./HomepageEditorForm";
import { HomepageEditorShell } from "./HomepageEditorShell";

describe("HomepageEditorForm", () => {
  it("regression_sections_use_collapsed_accordions_with_two_column_fields", () => {
    const { container } = render(
      <HomepageEditorShell title="Marketing homepage">
        <HomepageEditorForm config={DEFAULT_HOMEPAGE_CONFIG} onChange={() => undefined} />
      </HomepageEditorShell>
    );

    expect(container.querySelector(".ed-homepage-editor-shell")).toBeTruthy();
    expect(container.querySelector(".ed-homepage-editor")).toBeTruthy();

    const accordions = container.querySelectorAll(".ed-editor-accordion");
    expect(accordions.length).toBeGreaterThanOrEqual(8);
    expect(container.querySelector(".ed-editor-accordion--open")).toBeNull();

    expect(screen.getByText("Site")).toBeDefined();
    expect(screen.getByText("Navigation")).toBeDefined();
    expect(screen.getByText("Hero")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /Hero/i }));
    expect(screen.queryByLabelText("Hero background image URL")).toBeNull();
    expect(screen.getByLabelText("Hero background image or video")).toBeDefined();
    expect(container.querySelector(".ed-editable-form .ed-form-grid")).toBeTruthy();
  });

  it("regression_form_fields_expose_id_and_name_for_autofill", () => {
    const { container } = render(
      <HomepageEditorShell title="Marketing homepage">
        <HomepageEditorForm config={DEFAULT_HOMEPAGE_CONFIG} onChange={() => undefined} />
      </HomepageEditorShell>
    );

    fireEvent.click(screen.getByRole("button", { name: /^Site/i }));

    const fields = container.querySelectorAll(
      "input.ed-field__input, select.ed-field__input, textarea.ed-field__input"
    );
    expect(fields.length).toBeGreaterThan(0);
    fields.forEach((field) => {
      expect(field.getAttribute("id") || field.getAttribute("name")).toBeTruthy();
    });
  });
});
