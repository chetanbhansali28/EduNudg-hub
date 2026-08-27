import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@edunudg/ui";
import { AppErrorBoundary } from "./AppErrorBoundary";

function Boom() {
  throw new Error("render crash");
}

describe("AppErrorBoundary", () => {
  it("regression_error_boundary_shows_reload_instead_of_blank_screen", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(
      <ThemeProvider>
        <AppErrorBoundary>
          <Boom />
        </AppErrorBoundary>
      </ThemeProvider>
    );
    expect(screen.getByText(/Something went wrong/)).toBeDefined();
    expect(screen.getByRole("button", { name: "Reload" })).toBeDefined();
    spy.mockRestore();
  });
});
