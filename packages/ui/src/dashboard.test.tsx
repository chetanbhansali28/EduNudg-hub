import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import {
  DashboardHero,
  DashboardMetricCard,
  DashboardShell,
  DashboardVisibility,
} from "./dashboard";

describe("dashboard primitives", () => {
  it("renders hero greeting and responsive subtitle", () => {
    render(
      <DashboardHero
        greeting="Good afternoon, Platform 👋"
        subtitle={
          <>
            <span className="ed-dash-hero__subtitle-short">Platform Owner</span>
            <span className="ed-dash-hero__subtitle-long">Platform Owner Dashboard</span>
          </>
        }
      />
    );

    expect(screen.getByText("Good afternoon, Platform 👋")).toBeDefined();
    expect(screen.getByText("Platform Owner")).toBeDefined();
    expect(screen.getByText("Platform Owner Dashboard")).toBeDefined();
  });

  it("renders metric card with label and value", () => {
    render(
      <MemoryRouter>
        <DashboardMetricCard
          label="Active brands"
          value={12}
          hint="12 total"
          hintDesktop="12 active, 0 onboarding"
          icon={<span data-testid="metric-icon" />}
          href="/admin/brands"
        />
      </MemoryRouter>
    );

    expect(screen.getByText("Active brands")).toBeDefined();
    expect(screen.getByText("12")).toBeDefined();
    expect(screen.getByText("12 total")).toBeDefined();
    expect(screen.getByTestId("metric-icon")).toBeDefined();
  });

  it("splits mobile and desktop dashboard sections", () => {
    const { container } = render(
      <DashboardShell>
        <DashboardVisibility mobile={<p>Mobile block</p>} desktop={<p>Desktop block</p>} />
      </DashboardShell>
    );

    expect(screen.getByText("Mobile block")).toBeDefined();
    expect(screen.getByText("Desktop block")).toBeDefined();
    expect(container.querySelector(".ed-dash-only-mobile")).toBeTruthy();
    expect(container.querySelector(".ed-dash-only-desktop")).toBeTruthy();
  });
});
