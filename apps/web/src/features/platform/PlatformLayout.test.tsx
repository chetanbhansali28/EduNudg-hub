import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@edunudg/ui";
import { PlatformLayout } from "./PlatformLayout";

vi.mock("@/bootstrap/AuthProvider", () => ({
  useAuth: () => ({
    session: { user: { id: "u1" } },
    user: { id: "u1", email: "admin@edunudg.com", user_metadata: { full_name: "Admin" } },
    signOut: vi.fn(),
  }),
}));

vi.mock("@/hooks/useStaffShellWelcome", () => ({
  useStaffShellWelcome: () => ({
    welcomeHeading: "Welcome back, Admin",
    welcomeSubtitle: "Platform Owner",
    user: { name: "Admin", email: "admin@edunudg.com" },
  }),
}));

vi.mock("@/lib/homepageApi", () => ({
  fetchHomepageConfig: vi.fn().mockResolvedValue({
    meta: {
      siteName: "Abacus World HQ",
      logoUrl: "https://cdn.example/platform-logo.png",
      fontSans: "Inter",
      fontSerif: "Instrument Serif",
    },
  }),
}));

function renderPlatformShell() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/admin"]}>
        <ThemeProvider>
          <Routes>
            <Route path="/admin" element={<PlatformLayout />}>
              <Route index element={<div>Admin dashboard</div>} />
            </Route>
          </Routes>
        </ThemeProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("PlatformLayout", () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  it("regression_shows_homepage_logo_in_sidebar_brand", async () => {
    renderPlatformShell();

    await screen.findByText("Admin dashboard");

    await waitFor(() => {
      const logo = document.querySelector(".ed-sidebar__brand .ed-sidebar__logo-img");
      expect(logo?.getAttribute("src")).toBe("https://cdn.example/platform-logo.png");
    });
    expect(document.querySelector(".ed-sidebar__brand .ed-sidebar__name")?.textContent).toBe(
      "Abacus World HQ"
    );
  });
});
