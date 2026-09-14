import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { mergeSparkAcademyCenterLandingConfig } from "@/lib/centerLandingDefaults";
import { mergeSparkAcademyLandingConfig } from "@/lib/brandLandingDefaults";
import { LearnPublicLoginLayout } from "./LearnPublicLoginLayout";
import { LoginPage } from "@/features/auth/LoginPage";

vi.mock("@/bootstrap/TenantProvider", () => ({
  useTenant: () => ({
    portalType: "learn",
    hostname: "learn.digitley-pune.localhost",
    brandSlug: "digitley-pune",
    brandId: null,
    centerId: null,
    centerSlug: null,
  }),
}));

vi.mock("@/lib/centerLandingApi", () => ({
  fetchCenterLandingBundle: vi.fn(),
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
  useMembership: () => ({ data: [], isLoading: false, isFetched: true }),
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
      brandSlug: "digitley-pune",
      brandName: "Digitley",
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

describe("LearnPublicLoginLayout", () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it("regression_learn_login_renders_franchise_nav_and_footer", async () => {
    const { fetchCenterLandingBundle } = await import("@/lib/centerLandingApi");
    vi.mocked(fetchCenterLandingBundle).mockResolvedValue({
      config: mergeSparkAcademyCenterLandingConfig("Rathi Educom", "Digitley", "Pune"),
      profile: {
        centerId: "c1",
        centerSlug: "rathi-educom",
        centerName: "Rathi Educom",
        displayName: "Rathi Educom",
        city: "Pune",
        region: null,
        pincode: null,
        addressLine1: null,
        contactPhone: null,
        photoUrl: null,
        shortDescription: null,
        socialLinks: [],
        brandName: "Digitley",
        brandSlug: "digitley-pune",
      },
      publicCurriculum: [],
      marketingTheme: "spark-academy",
      publicStats: { centersCount: 1, studentsCount: 10 },
      legalPages: {},
      socialConnect: {},
    });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={["/login?center=rathi-educom"]}>
          <Routes>
            <Route element={<LearnPublicLoginLayout />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByRole("heading", { name: "Welcome back!" })).toBeDefined();
    expect(fetchCenterLandingBundle).toHaveBeenCalledWith("digitley-pune", "rathi-educom");
    expect(document.querySelector(".sa-nav")).toBeTruthy();
    expect(document.querySelector(".sa-site-footer")).toBeTruthy();
    expect(document.querySelector(".marketing-page--login")).toBeTruthy();
    expect(document.querySelector(".ed-franchise-wordmark__name")?.textContent).toBe("Rathi Educom");
    expect(document.querySelector(".ed-franchise-wordmark__byline")?.textContent).toBe("by Digitley");
    expect(document.querySelector(".ed-theme")).toBeNull();
    expect(document.querySelector("dialog.ac-modal")).toBeNull();
  });

  it("regression_learn_login_falls_back_to_brand_nav_without_center", async () => {
    const { fetchBrandLandingBundle } = await import("@/lib/brandLandingApi");
    vi.mocked(fetchBrandLandingBundle).mockResolvedValue({
      config: mergeSparkAcademyLandingConfig("Digitley"),
      publicCurriculum: [],
      marketingTheme: "spark-academy",
      publicStats: { centersCount: 1, studentsCount: 10 },
      legalPages: {},
      socialConnect: {},
    });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route element={<LearnPublicLoginLayout />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByRole("heading", { name: "Welcome back!" })).toBeDefined();
    expect(document.querySelector(".sa-nav")).toBeTruthy();
    expect(document.querySelector(".sa-site-footer")).toBeTruthy();
    expect(document.querySelector(".marketing-page--login")).toBeTruthy();
    expect(document.querySelector(".ed-franchise-wordmark__byline")).toBeNull();
    expect(document.querySelector(".ed-theme")).toBeNull();
  });
});
