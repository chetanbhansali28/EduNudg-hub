import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { EditorAccordion } from "./EditorAccordion";

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
    expect(container.querySelector(".ed-editor-accordion__toolbar button")).toBeTruthy();
  });
});
