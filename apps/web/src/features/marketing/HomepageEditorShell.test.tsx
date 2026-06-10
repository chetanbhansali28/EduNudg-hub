import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { EditorAccordion, HomepageEditorPanel, HomepageEditorShell } from "./HomepageEditorShell";

describe("HomepageEditorShell", () => {
  it("regression_save_button_lives_in_page_toolbar", () => {
    const { container } = render(
      <HomepageEditorShell title="Marketing homepage" onSave={vi.fn()}>
        <p>Form</p>
      </HomepageEditorShell>
    );
    const toolbar = container.querySelector(".ed-page-toolbar");
    const btn = toolbar?.querySelector("button");
    expect(btn?.textContent).toBe("Save changes");
  });

  it("regression_sticky_save_bar_when_onSave_provided", () => {
    const { container } = render(
      <HomepageEditorShell title="Marketing homepage" onSave={vi.fn()}>
        <p>Form</p>
      </HomepageEditorShell>
    );
    expect(container.querySelector(".ed-homepage-editor-shell--has-save")).toBeTruthy();
    expect(screen.getByRole("region", { name: "Save changes" })).toBeDefined();
    expect(screen.getAllByRole("button", { name: "Save changes" })).toHaveLength(2);
  });

  it("regression_panel_save_button_uses_uniform_label", () => {
    const onSave = vi.fn();
    render(
      <HomepageEditorShell title="Marketing pages">
        <HomepageEditorPanel title="Brand site" onSave={onSave}>
          <p>Editor fields</p>
        </HomepageEditorPanel>
      </HomepageEditorShell>
    );
    expect(screen.getByText("Brand site")).toBeDefined();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDefined();
  });
});

describe("EditorAccordion", () => {
  it("regression_collapsed_by_default", () => {
    render(
      <EditorAccordion title="Hero">
        <p>Form fields</p>
      </EditorAccordion>
    );
    const details = screen.getByText("Hero").closest("details");
    expect(details?.hasAttribute("open")).toBe(false);
  });

  it("regression_no_interactive_controls_inside_summary", () => {
    const { container } = render(
      <EditorAccordion title="FAQ" enabled onEnabledChange={() => undefined}>
        <p>Form fields</p>
      </EditorAccordion>
    );
    const summary = container.querySelector("summary");
    expect(summary?.querySelector("button")).toBeNull();
    expect(container.querySelector(".ed-editor-accordion__body button")).toBeTruthy();
    expect(screen.getByText("Visible on site")).toBeDefined();
  });

  it("regression_summary_title_precedes_body_content", () => {
    const { container } = render(
      <EditorAccordion title="Why us (feature blocks)" enabled onEnabledChange={() => undefined}>
        <p>Block fields</p>
      </EditorAccordion>
    );
    const details = container.querySelector("details.ed-editor-accordion");
    const summary = details?.querySelector("summary");
    const body = details?.querySelector(".ed-editor-accordion__body");
    expect(summary?.compareDocumentPosition(body!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
