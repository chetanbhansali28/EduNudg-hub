import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { mergeAbacusClassicLandingConfig, buildBrandLandingConfig, mergeSparkAcademyLandingConfig, mergeEduLearnLandingConfig } from "@/lib/brandLandingDefaults";
import { BrandPublicLayout } from "./BrandPublicLayout";

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

vi.mock("@/features/marketing/MarketingNav", () => ({
  MarketingNav: () => <nav data-testid="novu-nav">Novu nav</nav>,
}));

vi.mock("@/features/marketing/FooterSection", () => ({
  FooterSection: () => <footer data-testid="novu-footer">Novu footer</footer>,
}));

describe("BrandPublicLayout", () => {
  it("sprint1_renders_novu_layout_for_novu_theme", async () => {
    const { fetchBrandLandingBundle } = await import("@/lib/brandLandingApi");
    vi.mocked(fetchBrandLandingBundle).mockResolvedValue({
      config: buildBrandLandingConfig("Abacus World"),
      publicCurriculum: [],
      marketingTheme: "novu",
      publicStats: { centersCount: 0, studentsCount: 0 },
      legalPages: {},
      socialConnect: {},
    });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route element={<BrandPublicLayout />}>
              <Route path="/" element={<div>Page body</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText("Page body")).toBeDefined();
    expect(screen.getByTestId("novu-nav")).toBeDefined();
    expect(screen.getByTestId("novu-footer")).toBeDefined();
    expect(document.querySelector(".marketing-page--abacus-classic")).toBeNull();
  });

  it("sprint1_renders_abacus_classic_layout_for_abacus_theme", async () => {
    const { fetchBrandLandingBundle } = await import("@/lib/brandLandingApi");
    const config = mergeAbacusClassicLandingConfig("Smart Brain Abacus");
    config.footer.rich = {
      ...config.footer.rich!,
      brandStats: { franchiseCount: "5+", studentCount: "100+" },
    };
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
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route element={<BrandPublicLayout />}>
              <Route path="/" element={<div>Page body</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText("Page body")).toBeDefined();
    expect(document.querySelector(".marketing-page--abacus-classic")).toBeDefined();
    expect(screen.getByRole("banner")).toBeDefined();
    expect(screen.queryByTestId("novu-nav")).toBeNull();
    expect(screen.queryByTestId("novu-footer")).toBeNull();
    expect(screen.getByText("Franchises")).toBeDefined();
    expect(screen.getByText("5+")).toBeDefined();
    expect(document.querySelector(".ac-modal--spark")).toBeNull();
  });

  it("sprint1_renders_spark_academy_layout_for_spark_theme", async () => {
    const { fetchBrandLandingBundle } = await import("@/lib/brandLandingApi");
    vi.mocked(fetchBrandLandingBundle).mockResolvedValue({
      config: mergeSparkAcademyLandingConfig("Educat Demo"),
      publicCurriculum: [],
      marketingTheme: "spark-academy",
      publicStats: { centersCount: 2, studentsCount: 400 },
      legalPages: {},
      socialConnect: {},
    });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route element={<BrandPublicLayout />}>
              <Route path="/" element={<div>Page body</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText("Page body")).toBeDefined();
    expect(document.querySelector(".marketing-page--spark-academy")).toBeDefined();
    expect(screen.getByRole("banner")).toBeDefined();
    expect(screen.getByRole("heading", { name: "Explore" })).toBeDefined();
    expect(screen.queryByText(/Start Your Learning Journey Today!/i)).toBeNull();
    expect(screen.queryByText(/Start your network differently/i)).toBeNull();
    expect(document.querySelectorAll("dialog.ac-modal--spark")).toHaveLength(2);
  });

  it("regression_renders_edu_learn_layout_for_edu_learn_theme", async () => {
    const { fetchBrandLandingBundle } = await import("@/lib/brandLandingApi");
    vi.mocked(fetchBrandLandingBundle).mockResolvedValue({
      config: mergeEduLearnLandingConfig("AbacusWorld"),
      publicCurriculum: [],
      marketingTheme: "edu-learn",
      publicStats: { centersCount: 2, studentsCount: 400 },
      legalPages: {},
      socialConnect: {},
    });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route element={<BrandPublicLayout />}>
              <Route path="/" element={<div>Page body</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText("Page body")).toBeDefined();
    expect(document.querySelector(".marketing-page--edu-learn")).toBeDefined();
    expect(screen.getByRole("banner")).toBeDefined();
    expect(screen.getByRole("button", { name: "Get Started" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Apply franchise" })).toBeDefined();
    expect(document.querySelectorAll("dialog.ac-modal--edu-learn")).toHaveLength(2);
  });
});
