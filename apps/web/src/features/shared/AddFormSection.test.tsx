import { describe, expect, it, vi } from "vitest";
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

  it("regression_primary_action_renders_in_card_header", () => {
    const onSubmit = vi.fn();
    render(
      <AddFormSection
        buttonLabel="Record assessment"
        panelTitle="Record assessment"
        primaryAction={{ onClick: onSubmit }}
      >
        <p>Fields</p>
      </AddFormSection>
    );
    fireEvent.click(screen.getByRole("button", { name: "Record assessment" }));
    const save = screen.getByRole("button", { name: "Save" });
    expect(save.closest(".ed-card__header")).toBeTruthy();
    fireEvent.click(save);
    expect(onSubmit).toHaveBeenCalled();
  });

  it("regression_primary_action_renders_in_form_footer", () => {
    const onSubmit = vi.fn();
    render(
      <AddFormSection
        buttonLabel="Add program"
        panelTitle="Add program"
        actionsPlacement="footer"
        primaryAction={{ label: "Add program", onClick: onSubmit }}
      >
        <input aria-label="Program name" />
      </AddFormSection>
    );
    fireEvent.click(screen.getByRole("button", { name: "Add program" }));
    const save = screen.getByRole("button", { name: "Add program" });
    expect(save.closest(".ed-form-actions")).toBeTruthy();
    expect(save.closest(".ed-card__header")).toBeNull();
    fireEvent.click(save);
    expect(onSubmit).toHaveBeenCalled();
  });
});
