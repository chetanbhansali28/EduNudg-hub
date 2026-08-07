import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/homepageDefaults";
import {
  MARKETING_HOMEPAGE_CONFIG_QUERY_KEY,
  MARKETING_PUBLIC_BUNDLE_QUERY_KEY,
} from "@/lib/homepageApi";
import { MarketingPublicLayout } from "./MarketingPublicLayout";
import { MarketingHomePage } from "./MarketingHomePage";
import { LoginPage } from "@/features/auth/LoginPage";

vi.mock("@/lib/homepageApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/homepageApi")>();
  return {
    ...actual,
    fetchHomepageConfig: vi.fn().mockResolvedValue({
      ...DEFAULT_HOMEPAGE_CONFIG,
      meta: { ...DEFAULT_HOMEPAGE_CONFIG.meta, siteName: "EduNudg" },
    }),
    fetchMarketingPublicBundle: vi.fn().mockResolvedValue({
      config: {
        ...DEFAULT_HOMEPAGE_CONFIG,
        meta: { ...DEFAULT_HOMEPAGE_CONFIG.meta, siteName: "EduNudg" },
      },
      legalPages: {},
    }),
  };
});

vi.mock("@/bootstrap/AuthProvider", () => ({
  useAuth: () => ({
    session: null,
    signInWithOAuth: vi.fn(),
    signInWithEmail: vi.fn(),
    signInWithOtpPhone: vi.fn(),
    signInWithPasskey: vi.fn(),
  }),
}));

vi.mock("@/bootstrap/TenantProvider", () => ({
  useTenant: () => ({
    portalType: "platform",
    brandSlug: null,
    centerSlug: null,
  }),
}));

vi.mock("@/hooks/useMembership", () => ({
  useMembership: () => ({ data: [], isLoading: false }),
}));

vi.mock("@/hooks/usePlatformIntegration", () => ({
  usePlatformIntegrations: () => ({
    auth_email: true,
    auth_google: true,
    auth_facebook: false,
    auth_whatsapp_otp: false,
  }),
  usePlatformIntegration: () => true,
}));

vi.mock("./enterprise/EnterprisePlatformContent", () => ({
  EnterprisePlatformContent: () => (
    <div data-testid="enterprise-content">
      <h1>Learn with clarity.</h1>
    </div>
  ),
}));

vi.mock("@/hooks/usePortalBranding", () => ({
  usePortalBranding: () => ({ data: null }),
}));

vi.mock("@/hooks/useResolvedPortalTenant", () => ({
  useResolvedPortalTenant: () => ({ tenant: null, isResolving: false }),
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
    expect(screen.queryByRole("link", { name: "Sign In" })).toBeNull();
    expect(screen.getByText(DEFAULT_HOMEPAGE_CONFIG.footer.copyright)).toBeDefined();
    expect(document.querySelector(".ent-footer")).toBeTruthy();
    expect(document.querySelector(".novu-site-footer__qr")).toBeNull();
  });

  it("regression_renders_site_logo_when_configured", async () => {
    const { fetchMarketingPublicBundle } = await import("@/lib/homepageApi");
    vi.mocked(fetchMarketingPublicBundle).mockResolvedValueOnce({
      config: {
        ...DEFAULT_HOMEPAGE_CONFIG,
        meta: {
          ...DEFAULT_HOMEPAGE_CONFIG.meta,
          siteName: "EduNudg",
          logoUrl: "https://cdn.example/platform-logo.png?v=1",
        },
      },
      legalPages: {},
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
    const logo = document.querySelector(".ent-nav__logo-img");
    expect(logo).not.toBeNull();
    expect(logo?.getAttribute("src")).toBe("https://cdn.example/platform-logo.png?v=1");
  });

  it("regression_survives_config_only_cache_poisoning_from_favicon_query", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    // Simulate the old bug: raw HomepageConfig cached under ["marketing-homepage"].
    qc.setQueryData(MARKETING_HOMEPAGE_CONFIG_QUERY_KEY, DEFAULT_HOMEPAGE_CONFIG);

    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route element={<MarketingPublicLayout />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByLabelText("Email")).toBeDefined();
    expect(screen.getByRole("heading", { name: "Welcome back!" })).toBeDefined();
    expect(screen.queryByText("Loading…")).toBeNull();
    expect(qc.getQueryData(MARKETING_PUBLIC_BUNDLE_QUERY_KEY)).toEqual(
      expect.objectContaining({ config: expect.objectContaining({ hero: expect.any(Object) }) })
    );
  });

  it("regression_homepage_uses_outlet_config_under_public_layout", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    qc.setQueryData(MARKETING_HOMEPAGE_CONFIG_QUERY_KEY, DEFAULT_HOMEPAGE_CONFIG);

    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route element={<MarketingPublicLayout />}>
              <Route path="/" element={<MarketingHomePage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByRole("heading", { level: 1 })).toBeDefined();
    expect(screen.queryByText("Loading…")).toBeNull();
  });

  it("regression_public_bundle_query_key_differs_from_config_key", () => {
    expect(MARKETING_PUBLIC_BUNDLE_QUERY_KEY).not.toEqual(MARKETING_HOMEPAGE_CONFIG_QUERY_KEY);
    expect(MARKETING_PUBLIC_BUNDLE_QUERY_KEY[0]).toBe(MARKETING_HOMEPAGE_CONFIG_QUERY_KEY[0]);
  });
});
