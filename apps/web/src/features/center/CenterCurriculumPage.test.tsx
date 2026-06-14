import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CenterCurriculumPage } from "./CenterCurriculumPage";

vi.mock("@/bootstrap/TenantProvider", () => ({
  useTenant: () => ({ brandId: "brand-1", centerId: "center-1" }),
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
    expect(screen.getByText("Curriculum")).toBeDefined();
    expect(screen.getByText(/Course → Program → Chapter/i)).toBeDefined();
  });
});
