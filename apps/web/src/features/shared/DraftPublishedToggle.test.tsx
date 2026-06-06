import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DraftPublishedToggle } from "@edunudg/ui";

describe("DraftPublishedToggle", () => {
  it("regression_uses_primary_button_for_active_state", () => {
    const onChange = vi.fn();
    render(<DraftPublishedToggle value="draft" onChange={onChange} />);

    const draft = screen.getByRole("button", { name: "Draft" });
    const published = screen.getByRole("button", { name: "Published" });
    expect(draft.className).toContain("ed-btn--primary");
    expect(published.className).toContain("ed-btn--ghost");

    fireEvent.click(published);
    expect(onChange).toHaveBeenCalledWith("published");
  });
});
