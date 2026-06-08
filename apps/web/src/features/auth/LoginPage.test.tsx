import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import type { Membership } from "@/hooks/useMembership";
import { LoginPage } from "./LoginPage";
import { RequireMembership } from "./RequireMembership";

const { signInWithEmail, authState, membershipState, rerenderRef } = vi.hoisted(() => ({
  signInWithEmail: vi.fn(),
  authState: {
    session: null as { user: { id: string } } | null,
    user: null as { id: string } | null,
  },
  membershipState: {
    data: [] as Membership[],
    isLoading: false,
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
    signInWithOtpPhone: vi.fn().mockResolvedValue({ error: null }),
  }),
}));

vi.mock("@/bootstrap/TenantProvider", () => ({
  useTenant: () => ({
    portalType: "platform",
    hostname: "localhost",
    brandId: null,
    centerId: null,
    brandSlug: null,
    centerSlug: null,
  }),
}));

vi.mock("@/hooks/useMembership", () => ({
  useMembership: () => ({
    data: membershipState.data,
    isLoading: membershipState.isLoading,
  }),
}));

vi.mock("@/hooks/usePortalBranding", () => ({
  usePortalBranding: () => ({ data: undefined }),
}));

vi.mock("@/hooks/usePlatformIntegration", () => ({
  usePlatformIntegrations: () => ({
    auth_email: true,
    auth_google: true,
    auth_facebook: true,
    auth_whatsapp_otp: true,
    passkeys: false,
    payment_gateway: false,
    platform_brand_signup: true,
    public_pricing: true,
  }),
}));

vi.mock("@/lib/homepageApi", () => ({
  fetchHomepageConfig: vi.fn().mockResolvedValue({
    footer: { privacyHref: "/privacy", termsHref: "/terms" },
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
    authState.session = null;
    authState.user = null;
    membershipState.data = [];
    membershipState.isLoading = false;
  });

  it("renders email login form", () => {
    renderLogin();
    expect(screen.getByText("Welcome back!")).toBeDefined();
    expect(screen.getByRole("button", { name: "Log in" })).toBeDefined();
  });

  it("regression_redirects_to_admin_after_successful_email_sign_in", async () => {
    signInWithEmail.mockResolvedValue({ error: null });
    renderLogin();

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "admin@edunudg.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "admin" } });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() => {
      expect(signInWithEmail).toHaveBeenCalledWith("admin@edunudg.com", "admin");
      expect(screen.getByText("Admin home")).toBeDefined();
    });
  });

  it("regression_does_not_redirect_when_session_lacks_portal_membership", async () => {
    authState.session = { user: { id: "user-1" } };
    authState.user = { id: "user-1" };
    membershipState.data = [];

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    renderLogin("/login");

    await waitFor(() => {
      expect(screen.getByText(/do not have access to this portal/i)).toBeDefined();
    });

    expect(screen.queryByText("Admin home")).toBeNull();
    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("Maximum update depth exceeded")
    );
    consoleSpy.mockRestore();
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

    await waitFor(() => {
      expect(screen.getByText("Brand app home")).toBeDefined();
    });
  });

  it("shows validation error when email or password is empty", async () => {
    renderLogin();
    const form = document.querySelector(".ed-login-split__card form");
    expect(form).toBeTruthy();
    fireEvent.submit(form!);
    expect((await screen.findByRole("alert")).textContent).toContain("Enter email and password.");
    expect(signInWithEmail).not.toHaveBeenCalled();
  });
});
