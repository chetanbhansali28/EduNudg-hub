import { describe, expect, it, vi, beforeEach } from "vitest";
import { fetchBrandOwnerLoginEmail, upsertBrandOwnerCredentials } from "./brandOwnerCredentialsApi";

const rpcMock = vi.fn();
const invokeMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    rpc: rpcMock,
    functions: { invoke: invokeMock },
  }),
}));

describe("brandOwnerCredentialsApi", () => {
  beforeEach(() => {
    rpcMock.mockReset();
    invokeMock.mockReset();
  });

  it("fetchBrandOwnerLoginEmail returns email from rpc", async () => {
    rpcMock.mockResolvedValue({ data: "owner@brand.com", error: null });
    await expect(fetchBrandOwnerLoginEmail("brand-1")).resolves.toBe("owner@brand.com");
    expect(rpcMock).toHaveBeenCalledWith("get_brand_owner_login", { p_brand_id: "brand-1" });
  });

  it("fetchBrandOwnerLoginEmail throws on rpc error", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "denied" } });
    await expect(fetchBrandOwnerLoginEmail("brand-1")).rejects.toThrow("denied");
  });

  it("upsertBrandOwnerCredentials invokes edge function", async () => {
    invokeMock.mockResolvedValue({ data: { ok: true }, error: null });
    const result = await upsertBrandOwnerCredentials({
      brandId: "brand-1",
      email: " owner@brand.com ",
      password: "secret",
      fullName: "Brand Co",
    });
    expect(result.error).toBeNull();
    expect(invokeMock).toHaveBeenCalledWith("brand-owner-credentials", {
      body: {
        brandId: "brand-1",
        email: "owner@brand.com",
        password: "secret",
        fullName: "Brand Co",
      },
    });
  });

  it("regression_upsert_brand_owner_credentials_surfaces_function_error", async () => {
    invokeMock.mockResolvedValue({ data: { error: "Password required for a new brand login" }, error: null });
    const result = await upsertBrandOwnerCredentials({
      brandId: "brand-1",
      email: "new@brand.com",
    });
    expect(result.error).toBe("Password required for a new brand login");
  });
});
