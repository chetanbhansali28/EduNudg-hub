import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { AuthHandoffPage } from "./AuthHandoffPage";

const verifyOtpMock = vi.fn();

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

    await waitFor(() => {
      expect(verifyOtpMock).toHaveBeenCalledWith({ token_hash: "test-hash", type: "magiclink" });
      expect(screen.getByText("Staff backend")).toBeDefined();
    });
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
