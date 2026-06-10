import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppShell, ThemeProvider } from "@edunudg/ui";

describe("AppShell responsive", () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  it("regression_mobile_nav_toggle_opens_drawer", () => {
    const { container } = render(
      <MemoryRouter>
        <ThemeProvider>
          <AppShell
          portalLabel="Center"
          welcomeName="Test"
          user={{ name: "Test User", email: "test@example.com" }}
          navSections={[{ title: "Main menu", items: [{ href: "/", label: "Home", active: true }] }]}
          >
            <p>Page body</p>
          </AppShell>
        </ThemeProvider>
      </MemoryRouter>
    );

    const shell = container.querySelector(".ed-shell");
    expect(shell).toBeTruthy();
    expect(container.querySelector(".ed-mobile-bar")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /open menu/i }));
    expect(shell?.classList.contains("ed-shell--nav-open")).toBe(true);

    const sidebarClose = container.querySelector(".ed-sidebar__close");
    expect(sidebarClose).toBeTruthy();
    fireEvent.click(sidebarClose!);
    expect(shell?.classList.contains("ed-shell--nav-open")).toBe(false);
  });

  it("regression_sidebar_collapse_toggle_persists_class", () => {
    const { container } = render(
      <MemoryRouter>
        <ThemeProvider>
          <AppShell
            portalLabel="Platform"
            welcomeName="Test"
            navSections={[{ title: "Main menu", items: [{ href: "/admin", label: "Home", active: true }] }]}
            showUpgradeCard={false}
          >
            <p>Page body</p>
          </AppShell>
        </ThemeProvider>
      </MemoryRouter>
    );

    const shell = container.querySelector(".ed-shell");
    const collapseBtn = screen.getAllByRole("button", { name: /collapse sidebar/i })[0];
    fireEvent.click(collapseBtn);
    expect(shell?.classList.contains("ed-shell--sidebar-collapsed")).toBe(true);
    expect(screen.queryByText("Starter Plan")).toBeNull();
  });

  it("regression_header_omits_collapse_and_action_icons", () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <AppShell
            portalLabel="Platform Owner"
            welcomeHeading="Good morning, Platform 👋"
            welcomeSubtitle="Platform Owner · 2 brand signups pending review"
            user={{ name: "Platform Admin", email: "admin@edunudg.com" }}
            navSections={[{ title: "Main menu", items: [{ href: "/admin", label: "Home", active: true }] }]}
            showUpgradeCard={false}
          >
            <p>Page body</p>
          </AppShell>
        </ThemeProvider>
      </MemoryRouter>
    );

    expect(screen.queryByRole("button", { name: "Help" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Messages" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Notifications" })).toBeNull();
    expect(document.querySelector(".ed-header__collapse")).toBeNull();
    expect(screen.getByText("Good morning, Platform 👋")).toBeDefined();
    expect(screen.getByText("Platform Owner · 2 brand signups pending review")).toBeDefined();
  });

  it("regression_default_welcome_fallback", () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <AppShell
            portalLabel="Platform Owner"
            welcomeName="Platform Admin"
            user={{ name: "Platform Admin", email: "admin@edunudg.com" }}
            navSections={[{ title: "Main menu", items: [{ href: "/admin", label: "Home", active: true }] }]}
            showUpgradeCard={false}
          >
            <p>Page body</p>
          </AppShell>
        </ThemeProvider>
      </MemoryRouter>
    );

    expect(screen.getByText("Welcome back, Platform Admin 👋")).toBeDefined();
  });

  it("regression_header_includes_theme_toggle", () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <AppShell
            portalLabel="Platform Owner"
            welcomeName="Platform Admin"
            user={{ name: "Platform Admin", email: "admin@edunudg.com" }}
            navSections={[{ title: "Main menu", items: [{ href: "/admin", label: "Home", active: true }] }]}
            showUpgradeCard={false}
          >
            <p>Page body</p>
          </AppShell>
        </ThemeProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: /switch to dark mode/i })).toBeDefined();
  });
});
