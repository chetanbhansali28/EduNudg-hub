import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { buildCenterLandingConfig } from "@/lib/centerLandingDefaults";
import { CenterLandingPage } from "./CenterLandingPage";

const landingConfig = buildCenterLandingConfig("Abacus World Koramangala", "Abacus World", "Bengaluru");
const outletContext = {
  config: landingConfig,
  marketingTheme: "novu" as const,
  brandSlug: "abacusworld",
  centerSlug: "koramangala",
  publicCurriculum: [],
  publicStats: { centersCount: 0, studentsCount: 0 },
  profile: {
    centerId: "c1",
    centerSlug: "koramangala",
    centerName: "Abacus World Koramangala",
    displayName: null,
    city: "Bengaluru",
    region: null,
    pincode: null,
    addressLine1: null,
    contactPhone: null,
    photoUrl: null,
    shortDescription: null,
    socialLinks: [],
    brandName: "Abacus World",
    brandSlug: "abacusworld",
  },
};

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useOutletContext: () => outletContext,
  };
});

vi.mock("@/features/marketing/MarketingContent", () => ({
  MarketingContent: ({
    brandSlug,
    centerSlug,
    centerProfile,
  }: {
    brandSlug?: string;
    centerSlug?: string;
    centerProfile?: { centerName: string } | null;
  }) => (
    <div>
      Center landing
      {brandSlug && <span>{brandSlug}</span>}
      {centerSlug && <span>{centerSlug}</span>}
      {centerProfile && <span>{centerProfile.centerName}</span>}
    </div>
  ),
}));

describe("CenterLandingPage", () => {
  it("regression_loads_center_slug_into_marketing_content", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <CenterLandingPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText("Center landing")).toBeDefined();
    expect(screen.getByText("abacusworld")).toBeDefined();
    expect(screen.getByText("koramangala")).toBeDefined();
  });
});
