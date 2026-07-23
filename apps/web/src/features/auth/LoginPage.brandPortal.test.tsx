import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { expectRedirectTo } from "./expectRedirectTo";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import type { Membership } from "@/hooks/useMembership";
import { LoginPage } from "./LoginPage";
import { RequireMembership } from "./RequireMembership";
import { exactAccessibleName } from "@/test/exactAccessibleName";

/** IDs from supabase/seed/test-users.sql */
const ABACUSWORLD_BRAND_ID = "a0000000-0000-4000-8000-000000000001";

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
    portalType: "brand" as const,
    hostname: "abacusworld.localhost",
    brandId: "a0000000-0000-4000-8000-000000000001" as string | null,
    centerId: null as string | null,
    brandSlug: "abacusworld",
    centerSlug: null,
  },
  portalBrandingState: {
    data: {
      brandId: "a0000000-0000-4000-8000-000000000001",
      brandSlug: "abacusworld",
      brandName: "Abacus World",
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
        authState.session = { user: { id: "f0000000-0000-4000-8000-000000000002" } };
        authState.user = { id: "f0000000-0000-4000-8000-000000000002" };
        membershipState.data = [
          {
            id: "c0000000-0000-4000-8000-000000000002",
            role_key: "brand_owner",
            scope_type: "brand",
            brand_id: ABACUSWORLD_BRAND_ID,
            center_id: null,
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

function renderBrandLogin(initialPath = "/login") {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      { path: "/login", element: <LoginPage /> },
      {
        path: "/app",
        element: (
          <RequireMembership>
            <div>Brand app home</div>
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

describe("LoginPage brand portal", () => {
  beforeEach(() => {
    signInWithEmail.mockReset();
    authState.session = null;
    authState.user = null;
    membershipState.data = [];
    membershipState.isLoading = false;
    tenantState.brandId = ABACUSWORLD_BRAND_ID;
    portalBrandingState.isFetched = true;
    portalBrandingState.isFetching = false;
    portalBrandingState.isLoading = false;
  });

  it("regression_brand_owner_can_sign_in_on_brand_host", async () => {
    signInWithEmail.mockResolvedValue({ error: null });
    renderBrandLogin();

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "owner@edunudg.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "admin" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: exactAccessibleName("Log in") }));
    });

    await expectRedirectTo("Brand app home");
    expect(signInWithEmail).toHaveBeenCalledWith("owner@edunudg.com", "admin");

    expect(screen.queryByText(/do not have access to this portal/i)).toBeNull();
  });

  it("regression_brand_owner_allowed_when_domain_mapping_brand_id_is_stale", async () => {
    tenantState.brandId = "ddbdae88-a273-4300-92aa-c719cacc6bc2";

    authState.session = { user: { id: "f0000000-0000-4000-8000-000000000002" } };
    authState.user = { id: "f0000000-0000-4000-8000-000000000002" };
    membershipState.data = [
      {
        id: "c0000000-0000-4000-8000-000000000002",
        role_key: "brand_owner",
        scope_type: "brand",
        brand_id: ABACUSWORLD_BRAND_ID,
        center_id: null,
      },
    ];

    renderBrandLogin("/login");

    await expectRedirectTo("Brand app home");
    expect(screen.queryByText(/do not have access to this portal/i)).toBeNull();
  });

  it("regression_brand_owner_allowed_when_tenant_brand_id_comes_from_branding_only", async () => {
    tenantState.brandId = null;

    authState.session = { user: { id: "f0000000-0000-4000-8000-000000000002" } };
    authState.user = { id: "f0000000-0000-4000-8000-000000000002" };
    membershipState.data = [
      {
        id: "c0000000-0000-4000-8000-000000000002",
        role_key: "brand_owner",
        scope_type: "brand",
        brand_id: ABACUSWORLD_BRAND_ID,
        center_id: null,
      },
    ];

    renderBrandLogin("/login");

    await expectRedirectTo("Brand app home");
    expect(screen.queryByText(/do not have access to this portal/i)).toBeNull();
  });

  it("critical_platform_admin_handoff_next_param_reaches_staff_backend", async () => {
    authState.session = { user: { id: "e0000000-0000-4000-8000-000000000001" } };
    authState.user = { id: "e0000000-0000-4000-8000-000000000001" };
    membershipState.data = [
      {
        id: "m-platform",
        role_key: "platform_admin",
        scope_type: "platform",
        brand_id: null,
        center_id: null,
      },
    ];

    renderBrandLogin("/login?next=/app");

    await expectRedirectTo("Brand app home");
    expect(screen.queryByText(/do not have access to this portal/i)).toBeNull();
  });

  it("regression_existing_brand_owner_session_redirects_to_app", async () => {
    authState.session = { user: { id: "f0000000-0000-4000-8000-000000000002" } };
    authState.user = { id: "f0000000-0000-4000-8000-000000000002" };
    membershipState.data = [
      {
        id: "c0000000-0000-4000-8000-000000000002",
        role_key: "brand_owner",
        scope_type: "brand",
        brand_id: ABACUSWORLD_BRAND_ID,
        center_id: null,
      },
    ];

    renderBrandLogin("/login");

    await expectRedirectTo("Brand app home");
    expect(screen.queryByText(/do not have access to this portal/i)).toBeNull();
  });

});
