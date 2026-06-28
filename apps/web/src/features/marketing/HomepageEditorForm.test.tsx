import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/homepageDefaults";
import type { HomepageConfig } from "@/types/homepage";
import { HomepageEditorForm } from "./HomepageEditorForm";
import { HomepageEditorShell } from "./HomepageEditorShell";

describe("HomepageEditorForm", () => {
  it("regression_static_sections_and_collapsed_accordions", () => {
    const { container } = render(
      <HomepageEditorShell title="Homepage Configuration">
        <HomepageEditorForm config={DEFAULT_HOMEPAGE_CONFIG} onChange={() => undefined} />
      </HomepageEditorShell>
    );

    expect(container.querySelector(".ed-homepage-editor-shell")).toBeTruthy();
    expect(container.querySelector(".ed-editor-section-card")).toBeTruthy();

    const accordions = container.querySelectorAll(".ed-editor-accordion");
    expect(accordions.length).toBeGreaterThanOrEqual(5);
    expect(container.querySelector(".ed-editor-accordion--open")).toBeNull();

    expect(screen.getByRole("heading", { name: "Site Identity" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Navigation Management" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Pre-footer CTA & site footer" })).toBeDefined();
    expect(screen.getByText("Hero")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /Hero.*Main banner content/i }));
    expect(screen.queryByLabelText("Hero background image URL")).toBeNull();
    expect(screen.getByLabelText("Hero side image")).toBeDefined();
    expect(container.querySelector(".ed-editable-form .ed-form-grid")).toBeTruthy();
  });

  it("regression_form_fields_expose_id_and_name_for_autofill", () => {
    const { container } = render(
      <HomepageEditorShell title="Homepage Configuration">
        <HomepageEditorForm config={DEFAULT_HOMEPAGE_CONFIG} onChange={() => undefined} />
      </HomepageEditorShell>
    );

    const fields = container.querySelectorAll(
      "input.ed-field__input, select.ed-field__input, textarea.ed-field__input"
    );
    expect(fields.length).toBeGreaterThan(0);
    fields.forEach((field) => {
      expect(field.getAttribute("id") || field.getAttribute("name")).toBeTruthy();
    });
  });

  it("regression_tolerates_partial_or_missing_config", () => {
    const onChange = vi.fn();
    render(
      <HomepageEditorShell title="Homepage Configuration">
        <HomepageEditorForm
          config={{ meta: { siteName: "Partial" } } as HomepageConfig}
          onChange={onChange}
        />
      </HomepageEditorShell>
    );
    expect(screen.getByRole("heading", { name: "Site Identity" })).toBeDefined();
    expect(screen.getByDisplayValue("Partial")).toBeDefined();
  });
});
