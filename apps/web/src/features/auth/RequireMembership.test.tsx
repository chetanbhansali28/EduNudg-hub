import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import type { Membership } from "@/hooks/useMembership";
import { LoginPage } from "./LoginPage";
import { RequireMembership } from "./RequireMembership";

const { authState, membershipState, tenantState, portalBrandingState } = vi.hoisted(() => ({
  authState: {
    session: { user: { id: "user-1" } } as { user: { id: string } },
    user: { id: "user-1" } as { id: string },
  },
  membershipState: {
    data: [] as Membership[],
    isLoading: false,
  },
  tenantState: {
    portalType: "platform" as const,
    hostname: "localhost",
    brandId: null,
    centerId: null,
    brandSlug: null,
    centerSlug: null,
  },
  portalBrandingState: {
    data: undefined,
    isLoading: false,
    isFetched: true,
    isFetching: false,
  },
}));

vi.mock("@/bootstrap/AuthProvider", () => ({
  useAuth: () => ({
    session: authState.session,
    user: authState.user,
    signInWithOAuth: vi.fn(),
    signInWithEmail: vi.fn(),
    signInWithOtpPhone: vi.fn().mockResolvedValue({ error: null }),
  }),
}));

vi.mock("@/bootstrap/TenantProvider", () => ({
  useTenant: () => tenantState,
}));

vi.mock("@/hooks/useMembership", () => ({
  useMembership: () => ({
    data: membershipState.data,
    isLoading: membershipState.isLoading,
  }),
}));

vi.mock("@/hooks/usePortalBranding", () => ({
  usePortalBranding: () => portalBrandingState,
}));

vi.mock("@/hooks/usePlatformIntegration", () => ({
  usePlatformIntegrations: () => ({
    auth_email: true,
    auth_google: false,
    auth_facebook: false,
    auth_whatsapp_otp: false,
    passkeys: false,
    payment_gateway: false,
    platform_brand_signup: true,
    public_pricing: true,
  }),
}));

vi.mock("@/lib/homepageApi", () => ({
  fetchHomepageConfig: vi.fn().mockResolvedValue(undefined),
}));

function renderProtectedRoute(initialPath: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      { path: "/login", element: <LoginPage /> },
      {
        path: "/admin",
        element: (
          <RequireMembership>
            <div>Admin home</div>
          </RequireMembership>
        ),
      },
    ],
    { initialEntries: [initialPath] }
  );

  return render(
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

describe("RequireMembership", () => {
  beforeEach(() => {
    membershipState.data = [];
    membershipState.isLoading = false;
  });

  it("regression_avoids_login_admin_redirect_loop_without_membership", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    renderProtectedRoute("/admin");

    await waitFor(() => {
      expect(screen.getByText(/do not have access to this portal/i)).toBeDefined();
    });

    expect(screen.queryByText("Admin home")).toBeNull();
    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("Maximum update depth exceeded")
    );
    consoleSpy.mockRestore();
  });
});
