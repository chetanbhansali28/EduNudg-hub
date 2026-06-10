import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/homepageDefaults";
import { MarketingPublicLayout } from "./MarketingPublicLayout";

vi.mock("@/lib/homepageApi", async () => {
  const { DEFAULT_HOMEPAGE_CONFIG } = await import("@/lib/homepageDefaults");
  return {
    fetchHomepageConfig: vi.fn().mockResolvedValue({
      ...DEFAULT_HOMEPAGE_CONFIG,
      meta: { ...DEFAULT_HOMEPAGE_CONFIG.meta, siteName: "EduNudg" },
    }),
  };
});

describe("MarketingPublicLayout", () => {
  it("regression_renders_shared_nav_and_footer", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route element={<MarketingPublicLayout />}>
              <Route path="/" element={<div>Page body</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText("Page body")).toBeDefined();
    expect(screen.getByLabelText("Site")).toBeDefined();
    expect(screen.getByText(DEFAULT_HOMEPAGE_CONFIG.footer.copyright)).toBeDefined();
    expect(document.querySelector(".novu-site-footer__qr")).toBeNull();
  });

  it("regression_renders_site_logo_when_configured", async () => {
    const { fetchHomepageConfig } = await import("@/lib/homepageApi");
    vi.mocked(fetchHomepageConfig).mockResolvedValueOnce({
      ...DEFAULT_HOMEPAGE_CONFIG,
      meta: { ...DEFAULT_HOMEPAGE_CONFIG.meta, siteName: "EduNudg", logoUrl: "https://cdn.example/platform-logo.png?v=1" },
    });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route element={<MarketingPublicLayout />}>
              <Route path="/" element={<div>Page body</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await screen.findByText("Page body");
    const logo = document.querySelector(".novu-nav-bar__logo-img");
    expect(logo).not.toBeNull();
    expect(logo?.getAttribute("src")).toBe("https://cdn.example/platform-logo.png?v=1");
  });
});
