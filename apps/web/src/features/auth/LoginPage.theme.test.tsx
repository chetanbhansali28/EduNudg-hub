import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { LoginPage } from "./LoginPage";

vi.mock("@/bootstrap/AuthProvider", () => ({
  useAuth: () => ({
    session: null,
    signInWithOAuth: vi.fn(),
    signInWithEmail: vi.fn(),
    signInWithOtpPhone: vi.fn().mockResolvedValue({ error: null }),
  }),
}));

vi.mock("@/bootstrap/TenantProvider", () => ({
  useTenant: () => ({
    portalType: "center",
    hostname: "downtown.fundora.localhost",
    brandId: null,
    centerId: null,
    brandSlug: "fundora",
    centerSlug: "downtown",
  }),
}));

vi.mock("@/hooks/usePortalBranding", () => ({
  usePortalBranding: () => ({
    data: {
      brandId: null,
      brandSlug: "fundora",
      brandName: "Fundora",
      brandLogoUrl: null,
      centerId: null,
      centerSlug: "downtown",
      centerName: "Downtown Center",
      loginHeadline: null,
      loginSubtext: null,
    },
  }),
}));

describe("LoginPage Fundora theme", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders themed login shell for center portal", () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { container } = render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </QueryClientProvider>
    );
    expect(screen.getByText("Welcome back!")).toBeDefined();
    expect(container.querySelector(".ed-login-split")).toBeTruthy();
    expect(container.querySelector(".ed-login-split__card")).toBeTruthy();
  });
});
