import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { mergeAbacusClassicLandingConfig } from "@/lib/brandLandingDefaults";
import { BrandPublicLayout } from "./BrandPublicLayout";
import { LoginPage } from "@/features/auth/LoginPage";

vi.mock("@/bootstrap/TenantProvider", () => ({
  useTenant: () => ({
    portalType: "brand",
    hostname: "smart-brain-abacus.localhost",
    brandSlug: "smart-brain-abacus",
    brandId: null,
    centerId: null,
    centerSlug: null,
  }),
}));

vi.mock("@/lib/brandLandingApi", () => ({
  fetchBrandLandingBundle: vi.fn(),
}));

vi.mock("@/bootstrap/AuthProvider", () => ({
  useAuth: () => ({
    session: null,
    signInWithOAuth: vi.fn(),
    signInWithEmail: vi.fn(),
    signInWithOtpPhone: vi.fn(),
    signInWithPasskey: vi.fn(),
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

vi.mock("@/hooks/usePortalBranding", () => ({
  usePortalBranding: () => ({
    data: {
      brandId: null,
      brandSlug: "smart-brain-abacus",
      brandName: "Smart Brain Abacus",
      brandLogoUrl: null,
      centerId: null,
      centerSlug: null,
      centerName: null,
      loginHeadline: null,
      loginSubtext: null,
    },
    isLoading: false,
    isFetched: true,
    isFetching: false,
  }),
}));

vi.mock("@/hooks/useResolvedPortalTenant", () => ({
  useResolvedPortalTenant: () => ({ tenant: null, isResolving: false }),
}));

describe("BrandPublicLayout login chrome", () => {
  it("regression_brand_login_renders_public_nav_and_footer", async () => {
    const { fetchBrandLandingBundle } = await import("@/lib/brandLandingApi");
    const config = mergeAbacusClassicLandingConfig("Smart Brain Abacus");
    vi.mocked(fetchBrandLandingBundle).mockResolvedValue({
      config,
      publicCurriculum: [],
      marketingTheme: "abacus-classic",
      publicStats: { centersCount: 5, studentsCount: 100 },
      legalPages: {},
      socialConnect: {},
    });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route element={<BrandPublicLayout />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByRole("heading", { name: "Welcome back!" })).toBeDefined();
    expect(document.querySelector(".ac-nav")).toBeTruthy();
    expect(document.querySelector(".ac-nav__wordmark")?.textContent).toBe("Smart Brain Abacus");
    expect(document.querySelector(".marketing-page--login")).toBeTruthy();
    expect(document.querySelector(".marketing-page--abacus-classic")).toBeTruthy();
    expect(document.querySelector(".ac-nav")).toBeTruthy();
    expect(document.querySelector(".ac-footer")).toBeTruthy();
    expect(document.querySelector(".ed-theme")).toBeNull();
  });
});
