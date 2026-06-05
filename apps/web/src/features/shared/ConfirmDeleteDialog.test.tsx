import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";

describe("ConfirmDeleteDialog", () => {
  it("regression_requires_typing_confirm_before_delete", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <ConfirmDeleteDialog
        open
        onClose={onClose}
        onConfirm={onConfirm}
        description="This action is permanent. Once deleted, this data cannot be recovered."
      />
    );

    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByText(/cannot be recovered/i)).toBeDefined();

    const deleteBtn = screen.getByRole("button", { name: "Delete" });
    expect((deleteBtn as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(screen.getByLabelText(/Type CONFIRM/i), { target: { value: "CONFIRM" } });
    expect((deleteBtn as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(deleteBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes on cancel", () => {
    const onClose = vi.fn();
    render(<ConfirmDeleteDialog open onClose={onClose} onConfirm={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
