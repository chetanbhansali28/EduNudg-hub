import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expectRedirectTo } from "./expectRedirectTo";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import type { Membership } from "@/hooks/useMembership";
import { LoginPage } from "./LoginPage";
import { RequireMembership } from "./RequireMembership";
import { exactAccessibleName } from "@/test/exactAccessibleName";

const {
  signInWithEmail,
  signInWithPasskey,
  signInWithOAuth,
  signOut,
  authState,
  membershipState,
  tenantState,
  portalBrandingState,
  integrationState,
  rerenderRef,
} = vi.hoisted(() => ({
  signInWithEmail: vi.fn(),
  signInWithPasskey: vi.fn().mockResolvedValue({ error: null }),
  signInWithOAuth: vi.fn().mockResolvedValue(undefined),
  signOut: vi.fn().mockImplementation(async () => {
    authState.session = null;
    authState.user = null;
    try {
      rerenderRef.current();
    } catch {
      // Router unmounted during async sign-out in tests
    }
  }),
  authState: {
    session: null as { user: { id: string; email?: string } } | null,
    user: null as { id: string; email?: string } | null,
  },
  membershipState: {
    data: [] as Membership[],
    isLoading: false,
  },
  tenantState: {
    portalType: "platform" as "platform" | "learn" | "brand" | "center" | "parents",
    hostname: "localhost",
    brandId: null as string | null,
    centerId: null as string | null,
    brandSlug: null as string | null,
    centerSlug: null as string | null,
  },
  portalBrandingState: {
    data: undefined,
    isLoading: false,
    isFetched: true,
    isFetching: false,
  },
  integrationState: {
    auth_email: true,
    auth_google: true,
    auth_facebook: true,
    auth_whatsapp_otp: true,
    passkeys: false,
    payment_gateway: false,
    platform_brand_signup: true,
    public_pricing: true,
  },
  rerenderRef: { current: () => {} },
}));

vi.mock("@/bootstrap/AuthProvider", () => ({
  useAuth: () => ({
    session: authState.session,
    user: authState.user,
    signInWithEmail: async (email: string, password: string) => {
      const result = await signInWithEmail(email, password);
      if (!result.error) {
        authState.session = { user: { id: "user-1" } };
        authState.user = { id: "user-1" };
        membershipState.data = [
          {
            id: "1",
            role_key: "platform_admin",
            scope_type: "platform",
            brand_id: null,
            center_id: null,
          },
        ];
        rerenderRef.current();
      }
      return result;
    },
    signInWithOAuth,
    signInWithOtpPhone: vi.fn().mockResolvedValue({ error: null }),
    signInWithPasskey,
    signOut,
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
  usePlatformIntegrations: () => integrationState,
}));

vi.mock("@/lib/homepageApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/homepageApi")>();
  return {
    ...actual,
    fetchHomepageConfig: vi.fn().mockResolvedValue({
      footer: { privacyHref: "/privacy", termsHref: "/terms" },
    }),
  };
});

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

function renderLogin(initialPath = "/login") {
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
  const shell = <QueryClientProvider client={qc}><RouterProvider router={router} /></QueryClientProvider>;
  const view = render(shell);
  rerenderRef.current = () => view.rerender(shell);
  return view;
}

describe("LoginPage", () => {
  beforeEach(() => {
    signInWithEmail.mockReset();
    signInWithPasskey.mockClear();
    signInWithOAuth.mockClear();
    signOut.mockClear();
    authState.session = null;
    authState.user = null;
    membershipState.data = [];
    membershipState.isLoading = false;
    portalBrandingState.isFetched = true;
    portalBrandingState.isFetching = false;
    portalBrandingState.isLoading = false;
    integrationState.auth_email = true;
    integrationState.auth_google = true;
    integrationState.auth_facebook = true;
    integrationState.auth_whatsapp_otp = true;
    integrationState.passkeys = false;
  });

  it("renders email login form", () => {
    renderLogin();
    expect(screen.getByText("Welcome back!")).toBeDefined();
    expect(screen.getByRole("button", { name: exactAccessibleName("Log in") })).toBeDefined();
  });

  it("regression_primary_submit_accessible_name_is_exact_log_in", () => {
    renderLogin();
    const primary = screen.getByRole("button", { name: exactAccessibleName("Log in") });
    expect(primary.getAttribute("type")).toBe("submit");
    expect(screen.getByRole("button", { name: exactAccessibleName("Log in with Google") })).toBeDefined();
    expect(screen.getByRole("button", { name: exactAccessibleName("Log in with WhatsApp") })).toBeDefined();
  });

  it("regression_redirects_to_admin_after_successful_email_sign_in", async () => {
    signInWithEmail.mockResolvedValue({ error: null });
    renderLogin();

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "admin@edunudg.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "admin" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: exactAccessibleName("Log in") }));
    });

    await expectRedirectTo("Admin home");
    expect(signInWithEmail).toHaveBeenCalledWith("admin@edunudg.com", "admin");
  });

  it("regression_unauthorized_user_is_signed_out_with_access_denied_message", async () => {
    authState.session = { user: { id: "user-1", email: "stranger@gmail.com" } };
    authState.user = { id: "user-1", email: "stranger@gmail.com" };
    membershipState.data = [];

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    renderLogin("/login");

    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
      expect(screen.getByRole("alert").textContent).toContain("stranger@gmail.com is not authorized");
    });

    expect(screen.queryByRole("button", { name: exactAccessibleName("Sign out") })).toBeNull();
    expect(screen.queryByText("Admin home")).toBeNull();
    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("Maximum update depth exceeded")
    );
    consoleSpy.mockRestore();
  });

  it("regression_google_oauth_uses_login_redirect_url", () => {
    renderLogin("/login?next=%2Fadmin");
    fireEvent.click(screen.getByRole("button", { name: exactAccessibleName("Log in with Google") }));
    expect(signInWithOAuth).toHaveBeenCalledWith("google", {
      redirectTo: `${window.location.origin}/login?next=%2Fadmin`,
    });
  });

  it("regression_rejects_protocol_relative_next_redirect", async () => {
    authState.session = { user: { id: "user-1" } };
    authState.user = { id: "user-1" };
    membershipState.data = [
      {
        id: "1",
        role_key: "platform_admin",
        scope_type: "platform",
        brand_id: null,
        center_id: null,
      },
    ];

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const router = createMemoryRouter(
      [
        { path: "/login", element: <LoginPage /> },
        { path: "/admin", element: <div>Admin home</div> },
      ],
      { initialEntries: ["/login?next=//evil.com"] }
    );
    render(
      <QueryClientProvider client={qc}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    await expectRedirectTo("Admin home");
  });

  it("regression_honors_next_query_param_after_login", async () => {
    authState.session = { user: { id: "user-1" } };
    authState.user = { id: "user-1" };
    membershipState.data = [
      {
        id: "1",
        role_key: "platform_admin",
        scope_type: "platform",
        brand_id: null,
        center_id: null,
      },
    ];

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const router = createMemoryRouter(
      [
        { path: "/login", element: <LoginPage /> },
        { path: "/app", element: <div>Brand app home</div> },
        { path: "/admin", element: <div>Admin home</div> },
      ],
      { initialEntries: ["/login?next=/app"] }
    );
    render(
      <QueryClientProvider client={qc}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    await expectRedirectTo("Brand app home");
  });

  it("regression_platform_redirect_does_not_wait_on_unfetched_branding", async () => {
    portalBrandingState.isFetched = false;
    portalBrandingState.isFetching = true;

    authState.session = { user: { id: "user-1" } };
    authState.user = { id: "user-1" };
    membershipState.data = [
      {
        id: "1",
        role_key: "platform_admin",
        scope_type: "platform",
        brand_id: null,
        center_id: null,
      },
    ];

    renderLogin("/login");

    await expectRedirectTo("Admin home");
  });

  it("shows validation error when email or password is empty", async () => {
    renderLogin();
    const form = document.querySelector(".ed-login-card form");
    expect(form).toBeTruthy();
    fireEvent.submit(form!);
    expect((await screen.findByRole("alert")).textContent).toContain("Enter email and password.");
    expect(signInWithEmail).not.toHaveBeenCalled();
  });

  it("regression_learn_portal_redirects_to_dashboard_after_email_sign_in", async () => {
    tenantState.portalType = "learn";
    tenantState.brandSlug = "abacusworld";
    signInWithEmail.mockResolvedValue({ error: null });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const router = createMemoryRouter(
      [
        { path: "/login", element: <LoginPage /> },
        { path: "/", element: <div>Student dashboard</div> },
      ],
      { initialEntries: ["/login"] }
    );
    const shell = (
      <QueryClientProvider client={qc}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );
    const view = render(shell);
    rerenderRef.current = () => view.rerender(shell);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "student@edunudg.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "admin" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: exactAccessibleName("Log in") }));
    });

    await expectRedirectTo("Student dashboard");
    tenantState.portalType = "platform";
    tenantState.brandSlug = null;
  });

  it("regression_shows_passkey_button_when_passkeys_enabled", () => {
    integrationState.auth_google = false;
    integrationState.auth_facebook = false;
    integrationState.auth_whatsapp_otp = false;
    integrationState.passkeys = true;
    renderLogin();
    expect(screen.getByRole("button", { name: exactAccessibleName("Log in with passkey") })).toBeDefined();
  });

  it("regression_platform_portal_shows_oauth_buttons_directly", () => {
    renderLogin();
    expect(screen.getByRole("button", { name: exactAccessibleName("Log in with Google") })).toBeDefined();
    expect(screen.getByRole("button", { name: exactAccessibleName("Log in with WhatsApp") })).toBeDefined();
    expect(screen.queryByRole("button", { name: "More sign-in options" })).toBeNull();
  });

  it("regression_learn_portal_shows_oauth_options_without_more_sign_in_toggle", () => {
    tenantState.portalType = "learn";
    tenantState.brandSlug = "abacusworld";
    renderLogin();

    expect(screen.getByRole("button", { name: exactAccessibleName("Log in with Google") })).toBeDefined();
    expect(screen.queryByRole("button", { name: "More sign-in options" })).toBeNull();
    expect(screen.queryByText(/student dashboard/i)).toBeNull();
    expect(screen.queryByText(/student@edunudg.com/i)).toBeNull();

    tenantState.portalType = "platform";
    tenantState.brandSlug = null;
  });
});
