import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { expectRedirectTo } from "./expectRedirectTo";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import type { Membership } from "@/hooks/useMembership";
import { LoginPage } from "./LoginPage";
import { RequireMembership } from "./RequireMembership";
import { exactAccessibleName } from "@/test/exactAccessibleName";

const ABACUSWORLD_BRAND_ID = "a0000000-0000-4000-8000-000000000001";
const KORAMANGALA_CENTER_ID = "b0000000-0000-4000-8000-000000000001";

const { signInWithEmail, authState, membershipState, tenantState, portalBrandingState, rerenderRef } =
  vi.hoisted(() => ({
  signInWithEmail: vi.fn(),
  authState: {
    session: null as { user: { id: string } } | null,
    user: null as { id: string } | null,
  },
  membershipState: {
    data: [] as Membership[],
    isLoading: false,
  },
  tenantState: {
    portalType: "center" as const,
    hostname: "koramangala.abacusworld.localhost",
    brandId: "a0000000-0000-4000-8000-000000000001",
    centerId: "b0000000-0000-4000-8000-000000000001",
    brandSlug: "abacusworld",
    centerSlug: "koramangala",
  },
  portalBrandingState: {
    data: {
      brandId: "a0000000-0000-4000-8000-000000000001",
      brandSlug: "abacusworld",
      brandName: "Abacus World",
      brandLogoUrl: "https://cdn.example/logo.png",
      centerId: "b0000000-0000-4000-8000-000000000001",
      centerSlug: "koramangala",
      centerName: "Abacus World Koramangala",
      loginHeadline: null,
      loginSubtext: null,
    },
    isLoading: false,
    isFetched: true,
    isFetching: false,
  },
  rerenderRef: { current: () => {} },
}));

vi.mock("@/bootstrap/AuthProvider", () => ({
  useAuth: () => ({
    session: authState.session,
    user: authState.user,
    signInWithOAuth: vi.fn(),
    signInWithEmail: async (email: string, password: string) => {
      const result = await signInWithEmail(email, password);
      if (!result.error) {
        authState.session = { user: { id: "f0000000-0000-4000-8000-000000000003" } };
        authState.user = { id: "f0000000-0000-4000-8000-000000000003" };
        membershipState.data = [
          {
            id: "c0000000-0000-4000-8000-000000000003",
            role_key: "center_owner",
            scope_type: "center",
            brand_id: ABACUSWORLD_BRAND_ID,
            center_id: KORAMANGALA_CENTER_ID,
          },
        ];
        rerenderRef.current();
      }
      return result;
    },
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

vi.mock("@/hooks/useResolvedPortalTenant", async (importOriginal) => {
  const { resolvePortalTenantIds } = await importOriginal<
    typeof import("@/hooks/useResolvedPortalTenant")
  >();
  return {
    useResolvedPortalTenant: () => ({
      tenant: resolvePortalTenantIds(tenantState, portalBrandingState.data),
      isResolving: false,
    }),
  };
});

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
  fetchHomepageConfig: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: { status: "active" }, error: null }),
        }),
      }),
    }),
  }),
}));

function renderCenterLogin(initialPath = "/login") {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      { path: "/login", element: <LoginPage /> },
      {
        path: "/app",
        element: (
          <RequireMembership>
            <div>Center app home</div>
          </RequireMembership>
        ),
      },
    ],
    { initialEntries: [initialPath] }
  );
  const shell = (
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
  const view = render(shell);
  rerenderRef.current = () => view.rerender(shell);
  return view;
}

describe("LoginPage center portal", () => {
  beforeEach(() => {
    signInWithEmail.mockReset();
    authState.session = null;
    authState.user = null;
    membershipState.data = [];
    membershipState.isLoading = false;
    portalBrandingState.isFetched = true;
    portalBrandingState.isFetching = false;
    portalBrandingState.isLoading = false;
  });

  it("regression_center_owner_can_sign_in_on_franchise_host", async () => {
    signInWithEmail.mockResolvedValue({ error: null });
    renderCenterLogin();

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "center@edunudg.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "admin" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: exactAccessibleName("Log in") }));
    });

    await expectRedirectTo("Center app home");
    expect(signInWithEmail).toHaveBeenCalledWith("center@edunudg.com", "admin");

    expect(screen.queryByText(/do not have access to this portal/i)).toBeNull();
  });

  it("regression_existing_center_owner_session_redirects_to_app", async () => {
    authState.session = { user: { id: "f0000000-0000-4000-8000-000000000003" } };
    authState.user = { id: "f0000000-0000-4000-8000-000000000003" };
    membershipState.data = [
      {
        id: "c0000000-0000-4000-8000-000000000003",
        role_key: "center_owner",
        scope_type: "center",
        brand_id: ABACUSWORLD_BRAND_ID,
        center_id: KORAMANGALA_CENTER_ID,
      },
    ];

    renderCenterLogin("/login");

    await expectRedirectTo("Center app home");
    expect(screen.queryByText(/do not have access to this portal/i)).toBeNull();
  });

});
