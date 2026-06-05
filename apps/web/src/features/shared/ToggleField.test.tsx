import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ToggleField } from "@edunudg/ui";

describe("ToggleField", () => {
  it("regression_toggle_switch_updates_checked_state", () => {
    const onChange = vi.fn();
    render(<ToggleField label="Active" checked={false} onChange={onChange} />);

    const toggle = screen.getByRole("switch", { name: "Active" });
    expect(toggle.getAttribute("aria-checked")).toBe("false");

    fireEvent.click(toggle);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
