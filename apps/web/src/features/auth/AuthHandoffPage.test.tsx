import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { AuthHandoffPage } from "./AuthHandoffPage";
import { expectRedirectTo } from "./expectRedirectTo";

const { verifyOtpMock } = vi.hoisted(() => ({
  verifyOtpMock: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    auth: { verifyOtp: verifyOtpMock },
  }),
}));

describe("AuthHandoffPage", () => {
  beforeEach(() => {
    verifyOtpMock.mockReset();
    sessionStorage.clear();
  });

  it("critical_verifies_token_hash_and_redirects_to_next", async () => {
    verifyOtpMock.mockResolvedValue({ error: null });

    const router = createMemoryRouter(
      [
        { path: "/auth/handoff", element: <AuthHandoffPage /> },
        { path: "/app", element: <div>Staff backend</div> },
      ],
      { initialEntries: ["/auth/handoff?token_hash=test-hash&next=/app"] }
    );

    render(<RouterProvider router={router} />);

    await expectRedirectTo("Staff backend");
    expect(verifyOtpMock).toHaveBeenCalledWith({ token_hash: "test-hash", type: "magiclink" });
  });

  it("regression_same_origin_override_uses_full_page_reload", async () => {
    verifyOtpMock.mockResolvedValue({ error: null });
    const replace = vi.fn();
    const original = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...original, replace },
    });

    const router = createMemoryRouter([{ path: "/auth/handoff", element: <AuthHandoffPage /> }], {
      initialEntries: ["/auth/handoff?token_hash=test-hash&next=/app&portal=brand&brand=demo"],
    });

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/app?portal=brand&brand=demo");
    });
    expect(sessionStorage.getItem("edunudg.portalOverride")).toContain("demo");

    Object.defineProperty(window, "location", {
      configurable: true,
      value: original,
    });
  });

  it("regression_shows_error_when_verify_otp_fails", async () => {
    verifyOtpMock.mockResolvedValue({ error: { message: "Token expired" } });

    const router = createMemoryRouter([{ path: "/auth/handoff", element: <AuthHandoffPage /> }], {
      initialEntries: ["/auth/handoff?token_hash=expired-hash&next=/app"],
    });

    render(<RouterProvider router={router} />);

    expect((await screen.findByRole("alert")).textContent).toMatch(/token expired/i);
    expect(screen.queryByText("Staff backend")).toBeNull();
  });

  it("regression_shows_error_when_getSupabase_throws", async () => {
    verifyOtpMock.mockRejectedValue(new Error("Missing VITE_SUPABASE_URL"));
    // Force getSupabase path: verifyOtp is on the client; mock the whole call chain via reject above.
    // If verifyOtp throws (network / misconfig), handoff must not stay on "Signing you in…".
    const router = createMemoryRouter([{ path: "/auth/handoff", element: <AuthHandoffPage /> }], {
      initialEntries: ["/auth/handoff?token_hash=bad-hash&next=/app"],
    });

    render(<RouterProvider router={router} />);

    expect((await screen.findByRole("alert")).textContent).toMatch(/missing vite_supabase_url/i);
  });

  it("regression_rejects_unsafe_next_on_handoff", async () => {
    verifyOtpMock.mockResolvedValue({ error: null });

    const router = createMemoryRouter(
      [
        { path: "/auth/handoff", element: <AuthHandoffPage /> },
        { path: "/", element: <div>Portal home</div> },
      ],
      { initialEntries: ["/auth/handoff?token_hash=test-hash&next=//evil.com"] }
    );

    render(<RouterProvider router={router} />);

    await expectRedirectTo("Portal home");
  });

  it("regression_shows_error_when_token_hash_missing", async () => {
    const router = createMemoryRouter([{ path: "/auth/handoff", element: <AuthHandoffPage /> }], {
      initialEntries: ["/auth/handoff?next=/app"],
    });

    render(<RouterProvider router={router} />);

    expect((await screen.findByRole("alert")).textContent).toMatch(/incomplete/i);
    expect(verifyOtpMock).not.toHaveBeenCalled();
  });
});
