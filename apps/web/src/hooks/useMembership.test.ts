import { describe, expect, it, vi, beforeEach } from "vitest";
import { fetchActiveMemberships } from "./useMembership";

const rpcMock = vi.fn();
const eqMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    rpc: rpcMock,
    from: () => ({
      select: () => ({
        eq: (_column: string, _value: unknown) => ({
          eq: eqMock,
        }),
      }),
    }),
  }),
}));

describe("fetchActiveMemberships", () => {
  beforeEach(() => {
    rpcMock.mockReset();
    eqMock.mockReset();
    rpcMock.mockResolvedValue({ data: 1, error: null });
    eqMock.mockResolvedValue({
      data: [
        {
          id: "m1",
          role_key: "center_owner",
          scope_type: "center",
          brand_id: "brand-1",
          center_id: "center-1",
        },
      ],
      error: null,
    });
  });

  it("regression_accepts_invited_memberships_before_loading_active_rows", async () => {
    const rows = await fetchActiveMemberships("user-1");
    expect(rpcMock).toHaveBeenCalledWith("accept_own_invited_memberships");
    expect(eqMock).toHaveBeenCalledWith("status", "active");
    expect(rows).toEqual([
      {
        id: "m1",
        role_key: "center_owner",
        scope_type: "center",
        brand_id: "brand-1",
        center_id: "center-1",
      },
    ]);
  });

  it("regression_memberships_query_error_is_not_swallowed_as_empty", async () => {
    eqMock.mockResolvedValue({ data: null, error: { message: "rls denied" } });
    await expect(fetchActiveMemberships("user-1")).rejects.toEqual({ message: "rls denied" });
  });
});
