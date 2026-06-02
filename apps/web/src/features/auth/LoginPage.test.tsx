import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LoginPage } from "./LoginPage";

const signInWithEmail = vi.fn();

vi.mock("@/bootstrap/AuthProvider", () => ({
  useAuth: () => ({
    session: null,
    signInWithOAuth: vi.fn(),
    signInWithEmail,
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

vi.mock("@/hooks/usePortalBranding", () => ({
  usePortalBranding: () => ({ data: undefined }),
}));

vi.mock("@/lib/homepageApi", () => ({
  fetchHomepageConfig: vi.fn().mockResolvedValue({
    footer: { privacyHref: "/privacy", termsHref: "/terms" },
  }),
}));

function renderLogin(initialPath = "/login") {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<div>Admin home</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    signInWithEmail.mockReset();
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

  it("shows validation error when email or password is empty", async () => {
    renderLogin();
    const form = document.querySelector(".ed-login-split__card form");
    expect(form).toBeTruthy();
    fireEvent.submit(form!);
    expect((await screen.findByRole("alert")).textContent).toContain("Enter email and password.");
    expect(signInWithEmail).not.toHaveBeenCalled();
  });
});
