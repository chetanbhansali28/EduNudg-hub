import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CenterCurriculumPage } from "./CenterCurriculumPage";

vi.mock("@/bootstrap/TenantProvider", () => ({
  useTenant: () => ({ brandId: "brand-1", centerId: "center-1" }),
}));

vi.mock("@/features/center/hooks/useOpsBreakpoint", () => ({
  useOpsBreakpoint: () => ({ isDesktop: true, isMobile: false }),
}));

vi.mock("@/features/platform/hooks/useMutationError", () => ({
  useMutationError: () => ({ error: null, clear: vi.fn(), capture: vi.fn() }),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          is: () => ({
            in: () => ({
              order: () => Promise.resolve({ data: [], error: null }),
            }),
            order: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }),
    }),
    rpc: vi.fn(),
  }),
}));

describe("CenterCurriculumPage", () => {
  it("regression_renders_read_only_curriculum", () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <CenterCurriculumPage />
      </QueryClientProvider>
    );
    expect(screen.getByText("Curriculum Builder")).toBeDefined();
    expect(screen.getByRole("heading", { name: /Active Courses/i })).toBeDefined();
    expect(document.querySelector(".ed-curriculum-brand__layout")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Add course" })).toBeNull();
  });
});
