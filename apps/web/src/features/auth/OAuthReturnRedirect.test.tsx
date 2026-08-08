import { describe, expect, it } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { OAuthReturnRedirect } from "./OAuthReturnRedirect";

describe("OAuthReturnRedirect", () => {
  it("regression_oauth_hash_on_homepage_redirects_to_login", async () => {
    const router = createMemoryRouter(
      [
        { path: "/", element: <OAuthReturnRedirect /> },
        { path: "/login", element: <div>Login</div> },
      ],
      { initialEntries: ["/#access_token=test-token"] }
    );

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/login");
      expect(router.state.location.hash).toContain("access_token=");
    });
  });

  it("does not redirect when already on login", async () => {
    const router = createMemoryRouter(
      [
        { path: "/login", element: <OAuthReturnRedirect /> },
      ],
      { initialEntries: ["/login#access_token=test-token"] }
    );

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/login");
    });
  });
});
