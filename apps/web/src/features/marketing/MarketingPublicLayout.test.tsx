import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { MarketingPublicLayout } from "./MarketingPublicLayout";

vi.mock("@/lib/homepageApi", () => ({
  fetchHomepageConfig: vi.fn().mockResolvedValue({
    meta: { siteName: "EduNudg" },
    theme: { yellowGlow: "#f5e6a8", radiusSection: "48px" },
    nav: { links: [], ctaLabel: "Get started", ctaHref: "/login" },
    footer: {
      productLinks: [],
      companyLinks: [],
      connectLinks: [],
      copyright: "© Test",
      privacyHref: "/privacy",
      termsHref: "/terms",
    },
    footerCta: {
      title: "Start",
      subtitle: "Sub",
      ctaLabel: "Go",
      ctaHref: "/login",
      backgroundImageUrl: null,
    },
    hero: { backgroundImageUrl: "https://example.com/hero.jpg" },
  }),
}));

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
    expect(screen.getByText("© Test")).toBeDefined();
    expect(document.querySelector(".novu-site-footer__qr")).toBeNull();
  });

  it("regression_renders_site_logo_when_configured", async () => {
    const { fetchHomepageConfig } = await import("@/lib/homepageApi");
    vi.mocked(fetchHomepageConfig).mockResolvedValueOnce({
      meta: { siteName: "EduNudg", logoUrl: "https://cdn.example/platform-logo.png?v=1" },
      theme: { yellowGlow: "#f5e6a8", radiusSection: "48px" },
      nav: { links: [], ctaLabel: "Get started", ctaHref: "/login" },
      footer: {
        productLinks: [],
        companyLinks: [],
        connectLinks: [],
        copyright: "© Test",
        privacyHref: "/privacy",
        termsHref: "/terms",
      },
      footerCta: {
        title: "Start",
        subtitle: "Sub",
        ctaLabel: "Go",
        ctaHref: "/login",
        backgroundImageUrl: null,
      },
      hero: { backgroundImageUrl: "https://example.com/hero.jpg" },
    } as Awaited<ReturnType<typeof fetchHomepageConfig>>);

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
