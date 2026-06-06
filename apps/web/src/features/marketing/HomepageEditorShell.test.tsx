import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HomepageEditorShell, HomepageEditorPanel } from "./HomepageEditorShell";

describe("HomepageEditorShell", () => {
  it("regression_save_button_lives_in_page_toolbar", () => {
    render(
      <HomepageEditorShell title="Marketing homepage" onSave={vi.fn()}>
        <p>Form</p>
      </HomepageEditorShell>
    );
    const btn = screen.getByRole("button", { name: "Save" });
    expect(btn.closest(".ed-page-toolbar")).toBeTruthy();
  });

  it("regression_panel_save_button_uses_uniform_label", () => {
    const onSave = vi.fn();
    render(
      <HomepageEditorShell title="Marketing pages">
        <HomepageEditorPanel title="Brand site" onSave={onSave}>
          <p>Editor fields</p>
        </HomepageEditorPanel>
      </HomepageEditorShell>
    );
    expect(screen.getByText("Brand site")).toBeDefined();
    expect(screen.getByRole("button", { name: "Save" })).toBeDefined();
  });
});
