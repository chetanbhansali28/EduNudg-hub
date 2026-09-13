import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, Link } from "react-router-dom";
import {
  UnsavedMarketingChangesDialog,
  resolveInternalAppPath,
  useUnsavedMarketingNavigation,
} from "./UnsavedMarketingChangesDialog";

describe("UnsavedMarketingChangesDialog", () => {
  it("regression_unsaved_marketing_dialog_asks_to_save", () => {
    const onStay = vi.fn();
    const onSave = vi.fn();
    render(
      <UnsavedMarketingChangesDialog
        open
        marketingTheme="spark-academy"
        onStay={onStay}
        onSave={onSave}
      />
    );

    expect(screen.getByRole("dialog", { name: "Save your changes?" })).toBeDefined();
    expect(screen.getByText(/unsaved homepage or center-site edits/i)).toBeDefined();
    expect(screen.getByRole("button", { name: "OK" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDefined();
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Stay" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Discard and leave" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "OK" }));
    expect(onSave).toHaveBeenCalled();
  });

  it("regression_unsaved_marketing_dialog_uses_website_theme_and_ok_cancel", () => {
    const onStay = vi.fn();
    render(
      <UnsavedMarketingChangesDialog
        open
        marketingTheme="spark-academy"
        onStay={onStay}
        onSave={() => undefined}
      />
    );
    const dialog = screen.getByRole("dialog", { name: "Save your changes?" });
    expect(dialog.className).toContain("ed-unsaved-changes--spark-academy");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onStay).toHaveBeenCalled();
  });
});

describe("resolveInternalAppPath", () => {
  it("regression_unsaved_marketing_guard_resolves_in_app_paths", () => {
    expect(resolveInternalAppPath("/app/centers", "http://digitley-pune.localhost:9000")).toBe("/app/centers");
    expect(resolveInternalAppPath("https://other.example/app", "http://digitley-pune.localhost:9000")).toBeNull();
    expect(resolveInternalAppPath("#founders", "http://digitley-pune.localhost:9000")).toBeNull();
  });
});

function LeaveHarness() {
  const { dialog } = useUnsavedMarketingNavigation({
    isDirty: true,
    marketingTheme: "spark-academy",
    onSave: async () => true,
  });
  return (
    <div>
      <Link to="/app/centers">Centers</Link>
      {dialog}
    </div>
  );
}

describe("useUnsavedMarketingNavigation", () => {
  it("regression_unsaved_marketing_hook_does_not_require_data_router", () => {
    expect(() =>
      render(
        <MemoryRouter initialEntries={["/app/homepage"]}>
          <LeaveHarness />
        </MemoryRouter>
      )
    ).not.toThrow();
  });

  it("regression_unsaved_marketing_navigation_opens_dialog_and_scrolls", () => {
    const scrollTo = vi.fn();
    vi.stubGlobal("scrollTo", scrollTo);
    render(
      <MemoryRouter initialEntries={["/app/homepage"]}>
        <Routes>
          <Route path="/app/homepage" element={<LeaveHarness />} />
          <Route path="/app/centers" element={<p>Centers page</p>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("link", { name: "Centers" }));
    expect(screen.getByRole("dialog", { name: "Save your changes?" })).toBeDefined();
    expect(scrollTo).toHaveBeenCalled();
    expect(screen.queryByText("Centers page")).toBeNull();
    vi.unstubAllGlobals();
  });
});
