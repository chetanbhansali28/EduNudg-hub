import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@edunudg/ui";
import { fetchStudentLearnHome } from "@/lib/studentLearnApi";
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
    portalType: "learn",
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

vi.mock("@/hooks/useFeatureFlag", () => ({
  useBrandFeatureFlags: () => ({ competitions: true }),
  useBrandFeatureFlagsReady: () => true,
  useFeatureFlag: () => true,
}));

vi.mock("@/lib/studentLearnApi", () => ({
  StudentLearnRpcError: class StudentLearnRpcError extends Error {},
  fetchStudentLearnHome: vi.fn(),
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
      matches: query.includes("min-width: 1024px"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    vi.mocked(fetchStudentLearnHome).mockResolvedValue({
      student: {
        full_name: "Alex Student",
        student_code: "1001",
        profile: { photo_url: null },
      },
      brand: { id: "brand-1", name: "Abacus World", logo_url: null },
      center: { id: "c1", display_name: "Koramangala Center", public_url: "" },
    } as never);
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

  it("regression_learn_shell_lockup_shows_franchise_by_brand", async () => {
    vi.mocked(fetchStudentLearnHome).mockResolvedValue({
      student: {
        full_name: "Alex Student",
        student_code: "1001",
        profile: { photo_url: null },
      },
      brand: { id: "brand-1", name: "Smart Brain", logo_url: "https://cdn.example/smart-brain-logo.png" },
      center: { id: "c1", display_name: "Rathi Educon", public_url: "" },
    } as never);

    renderStudentShell();

    await waitFor(() => {
      expect(document.querySelector(".ed-sidebar__name")?.textContent).toBe("Rathi Educon");
    });
    expect(document.querySelector(".ed-sidebar__tagline")?.textContent).toBe("by Abacus World");
  });

  it("regression_learn_header_shows_student_profile_photo_when_photo_url_set", async () => {
    vi.mocked(fetchStudentLearnHome).mockResolvedValue({
      student: {
        full_name: "Vihaan",
        student_code: "250DB0E7",
        profile: { photo_url: "https://cdn.example/students/vihaan/photo.jpg" },
      },
      brand: { id: "brand-1", name: "Abacus World", logo_url: null },
      center: { id: "c1", display_name: "Koramangala Center", public_url: "" },
    } as never);

    renderStudentShell();

    await waitFor(() => {
      const img = document.querySelector("img.ed-header__avatar--img") as HTMLImageElement | null;
      expect(img?.getAttribute("src")).toBe("https://cdn.example/students/vihaan/photo.jpg");
    });
  });
});
