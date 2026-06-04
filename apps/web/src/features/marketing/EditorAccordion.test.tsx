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
});
