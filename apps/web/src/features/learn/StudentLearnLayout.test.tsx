import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@edunudg/ui";
import { StudentLearnLayout } from "./StudentLearnLayout";

vi.mock("@/bootstrap/AuthProvider", () => ({
  useAuth: () => ({
    session: { user: { id: "u1" } },
    user: {
      id: "u1",
      email: "alex@example.com",
      user_metadata: { full_name: "Alex Student" },
    },
    signOut: vi.fn(),
  }),
}));

vi.mock("@/bootstrap/TenantProvider", () => ({
  useTenant: () => ({
    brandId: "brand-1",
    brandSlug: "abacusworld",
    centerSlug: null,
    portalType: "student",
  }),
}));

vi.mock("@/hooks/usePortalBranding", () => ({
  usePortalBranding: () => ({
    data: {
      brandId: "brand-1",
      brandSlug: "abacusworld",
      brandName: "Abacus World",
      brandLogoUrl: null,
      centerId: null,
      centerSlug: null,
      centerName: null,
      loginHeadline: null,
      loginSubtext: null,
    },
  }),
}));

vi.mock("@/features/learn/hooks/useStudentBreakpoint", () => ({
  useStudentBreakpoint: () => ({ isMobile: false }),
}));

vi.mock("@/lib/studentLearnApi", () => ({
  StudentLearnRpcError: class StudentLearnRpcError extends Error {},
  fetchStudentLearnHome: vi.fn().mockResolvedValue({
    student: {
      full_name: "Alex Student",
      student_code: "1001",
      profile: { photo_url: null },
    },
  }),
}));

function renderStudentShell() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/"]}>
        <ThemeProvider>
          <Routes>
            <Route path="/" element={<StudentLearnLayout />}>
              <Route index element={<div>Student home</div>} />
            </Route>
          </Routes>
        </ThemeProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("StudentLearnLayout", () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("min-width: 900px"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  it("regression_omits_support_sidebar_and_header_action_icons", async () => {
    renderStudentShell();

    await waitFor(() => {
      expect(screen.getByText("Student home")).toBeDefined();
    });

    expect(screen.queryByRole("link", { name: "Support" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Help" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Notifications" })).toBeNull();
    expect(screen.getByRole("button", { name: "Logout" })).toBeDefined();
  });
});
