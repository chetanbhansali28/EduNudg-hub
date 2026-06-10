import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { AuthHandoffPage } from "./AuthHandoffPage";

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

    expect(await screen.findByText("Staff backend")).toBeDefined();
    expect(verifyOtpMock).toHaveBeenCalledWith({ token_hash: "test-hash", type: "magiclink" });
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

  it("regression_shows_error_when_token_hash_missing", async () => {
    const router = createMemoryRouter([{ path: "/auth/handoff", element: <AuthHandoffPage /> }], {
      initialEntries: ["/auth/handoff?next=/app"],
    });

    render(<RouterProvider router={router} />);

    expect((await screen.findByRole("alert")).textContent).toMatch(/incomplete/i);
    expect(verifyOtpMock).not.toHaveBeenCalled();
  });
});
