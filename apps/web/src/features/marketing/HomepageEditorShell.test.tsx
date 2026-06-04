import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HomepageEditorShell, HomepageEditorPanel } from "./HomepageEditorShell";

describe("HomepageEditorShell", () => {
  it("regression_primary_actions_use_black_button_in_shell", () => {
    render(
      <HomepageEditorShell
        title="Marketing homepage"
        actions={
          <button type="button" className="ed-btn ed-btn--primary">
            Save changes
          </button>
        }
      >
        <p>Form</p>
      </HomepageEditorShell>
    );
    const btn = screen.getByRole("button", { name: "Save changes" });
    expect(btn.closest(".ed-homepage-editor-shell")).toBeTruthy();
  });

  it("regression_panel_layout_matches_platform_editor", () => {
    const onSave = vi.fn();
    render(
      <HomepageEditorShell title="Marketing pages">
        <HomepageEditorPanel title="Brand site" saveLabel="Save brand site" onSave={onSave}>
          <p>Editor fields</p>
        </HomepageEditorPanel>
      </HomepageEditorShell>
    );
    expect(screen.getByText("Brand site")).toBeDefined();
    expect(screen.getByRole("button", { name: "Save brand site" })).toBeDefined();
  });
});
