import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { AddFormSection } from "./AddFormSection";

describe("AddFormSection", () => {
  it("regression_add_form_hidden_until_trigger_clicked", () => {
    render(
      <AddFormSection buttonLabel="Add item" panelTitle="Add item">
        <input aria-label="Item name" />
      </AddFormSection>
    );

    expect(screen.getByRole("button", { name: "Add item" })).toBeDefined();
    expect(screen.queryByLabelText("Item name")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Add item" }));
    expect(screen.getByLabelText("Item name")).toBeDefined();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByLabelText("Item name")).toBeNull();
    expect(screen.getByRole("button", { name: "Add item" })).toBeDefined();
  });
});
