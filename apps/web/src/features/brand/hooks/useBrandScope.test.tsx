import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useBrandScope } from "./useBrandScope";

vi.mock("@/bootstrap/TenantProvider", () => ({
  useTenant: () => ({
    portalType: "brand",
    brandId: null,
    brandSlug: "abacusworld",
    centerId: null,
    centerSlug: null,
    hostname: "abacusworld.localhost",
  }),
}));

const mockMaybeSingle = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          is: () => ({
            maybeSingle: mockMaybeSingle,
          }),
        }),
      }),
    }),
  }),
}));

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("useBrandScope", () => {
  it("regression_resolves_brand_id_from_slug", async () => {
    mockMaybeSingle.mockResolvedValue({ data: { id: "brand-uuid" }, error: null });
    const { result } = renderHook(() => useBrandScope(), { wrapper });
    await waitFor(() => expect(result.current.brandId).toBe("brand-uuid"));
  });
});
