import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { CrudRowActions } from "./CrudRowActions";

describe("CrudRowActions", () => {
  it("regression_delete_opens_confirm_dialog", () => {
    const onDelete = vi.fn();
    render(
      <CrudRowActions
        editing={false}
        onEdit={vi.fn()}
        onSave={vi.fn()}
        onCancel={vi.fn()}
        onDelete={onDelete}
        deleteDescription="Brands must not reference this plan."
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByRole("dialog")).toBeDefined();
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/Brands must not reference this plan/i)).toBeDefined();

    const deleteBtn = within(dialog).getByRole("button", { name: "Delete" });
    fireEvent.change(screen.getByLabelText(/Type CONFIRM/i), { target: { value: "CONFIRM" } });
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
