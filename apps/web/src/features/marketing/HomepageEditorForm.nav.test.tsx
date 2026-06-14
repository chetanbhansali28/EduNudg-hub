import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/homepageDefaults";
import { HomepageEditorForm } from "./HomepageEditorForm";

describe("HomepageEditorForm navigation", () => {
  it("regression_can_add_and_edit_nav_menu_items", () => {
    let config = { ...DEFAULT_HOMEPAGE_CONFIG };
    const onChange = vi.fn((next: typeof config) => {
      config = next;
    });

    render(<HomepageEditorForm config={config} onChange={onChange} />);

    expect(screen.getByRole("heading", { name: "Navigation Management" })).toBeDefined();
    expect(screen.getAllByLabelText("Label").length).toBeGreaterThanOrEqual(1);

    fireEvent.click(screen.getByRole("button", { name: /Add menu item/i }));
    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls.at(-1)?.[0];
    expect(lastCall).toBeDefined();
    expect(lastCall!.nav.links.length).toBe(DEFAULT_HOMEPAGE_CONFIG.nav.links.length + 1);
  });
});
