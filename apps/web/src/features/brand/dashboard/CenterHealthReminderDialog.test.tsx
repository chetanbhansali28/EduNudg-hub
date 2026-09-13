import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { buildCenterHealthScore } from "@/lib/brandDashboardHelpers";
import type { BrandDashboardHome } from "@/lib/brandDashboardHomeApi";
import { CenterHealthReminderDialog } from "./CenterHealthReminderDialog";

function polyfillDialog() {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  });
}

const data = {
  unassignedLeads: 0,
  unassignedLeadsTrend: null,
  pendingFranchiseApps: 0,
  staleLeads: 0,
  revenueTotalCents: 0,
  revenueTrendPercent: null,
  revenueBars: [],
  ...(() => {
    const health = buildCenterHealthScore({
      curriculumCount: 1,
      feedbackCount: 1,
      studentCount: 2,
      franchiseCount: 1,
      homepageSet: true,
      centerSiteSet: false,
    });
    return { centerHealthPercent: health.percent, centerHealthChecks: health.checks };
  })(),
  activeCenters: 1,
  pendingCenters: 0,
  centerAvatars: [],
  extraCenterCount: 0,
  activities: [],
  expansionGoals: [],
} satisfies BrandDashboardHome;

describe("CenterHealthReminderDialog", () => {
  beforeEach(() => {
    polyfillDialog();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("regression_center_health_login_popup_lists_missing_setup", () => {
    render(
      <MemoryRouter>
        <CenterHealthReminderDialog open data={data} onClose={() => undefined} />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Finish Center Health setup" })).toBeDefined();
    expect(document.querySelector(".ed-brand-dash__health-dialog")).toBeDefined();
    expect(screen.getByText("Complete the remaining checks so your brand setup reaches 100%.")).toBeDefined();
    expect(screen.getByText("50% setup complete. Each check is equally weighted.")).toBeDefined();
    expect(screen.getByRole("link", { name: "Add 1 more feedback (1 of 2)" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Add 1 more franchise (1 of 2)" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Set franchise site content" })).toBeDefined();
    expect(screen.getByText("Homepage content is set")).toBeDefined();
  });

  it("regression_center_health_login_popup_closes_on_got_it", () => {
    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <CenterHealthReminderDialog open data={data} onClose={onClose} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "Got it" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("regression_center_health_login_popup_css_is_centered_themed_and_responsive", () => {
    const css = readFileSync(resolve(__dirname, "brandDashboard.css"), "utf8");
    expect(css).toMatch(/\.ed-brand-dash__health-dialog\s*\{[^}]*inset:\s*0/s);
    expect(css).toMatch(/\.ed-brand-dash__health-dialog\s*\{[^}]*margin:\s*auto/s);
    expect(css).toContain("var(--ed-card)");
    expect(css).toContain("var(--ed-primary)");
    expect(css).toContain("var(--ed-border)");
    expect(css).toContain("@media (max-width: 640px)");
    expect(css).toContain("safe-area-inset-bottom");
  });
});
