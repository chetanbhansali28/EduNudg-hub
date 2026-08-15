import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  fetchCenterOwnerLoginEmail,
  shouldSyncCenterOwnerCredentials,
  upsertCenterOwnerCredentials,
} from "./centerOwnerCredentialsApi";

const rpcMock = vi.fn();
const invokeMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    rpc: rpcMock,
    functions: { invoke: invokeMock },
  }),
}));

describe("centerOwnerCredentialsApi", () => {
  beforeEach(() => {
    rpcMock.mockReset();
    invokeMock.mockReset();
  });

  it("fetchCenterOwnerLoginEmail returns email from rpc", async () => {
    rpcMock.mockResolvedValue({ data: "owner@center.com", error: null });
    await expect(fetchCenterOwnerLoginEmail("center-1")).resolves.toBe("owner@center.com");
    expect(rpcMock).toHaveBeenCalledWith("get_center_owner_login", { p_center_id: "center-1" });
  });

  it("fetchCenterOwnerLoginEmail throws on rpc error", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "denied" } });
    await expect(fetchCenterOwnerLoginEmail("center-1")).rejects.toThrow("denied");
  });

  it("upsertCenterOwnerCredentials invokes edge function", async () => {
    invokeMock.mockResolvedValue({ data: { ok: true }, error: null });
    const result = await upsertCenterOwnerCredentials({
      centerId: "center-1",
      brandId: "brand-1",
      email: " owner@center.com ",
      password: "secret",
      fullName: "Arti Drawing",
    });
    expect(result.error).toBeNull();
    expect(invokeMock).toHaveBeenCalledWith("center-owner-credentials", {
      body: {
        centerId: "center-1",
        brandId: "brand-1",
        email: "owner@center.com",
        password: "secret",
        fullName: "Arti Drawing",
      },
    });
  });

  it("regression_short_admin_password_is_rejected_before_edge_function", async () => {
    const result = await upsertCenterOwnerCredentials({
      centerId: "center-1",
      brandId: "brand-1",
      email: "owner@center.com",
      password: "admin",
    });
    expect(result.error).toMatch(/at least 6 characters/i);
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it("regression_upsert_center_owner_credentials_parses_edge_400_body", async () => {
    invokeMock.mockResolvedValue({
      data: null,
      error: {
        message: "Edge Function returned a non-2xx status code",
        context: new Response(JSON.stringify({ error: "Password must be at least 6 characters." }), {
          status: 400,
        }),
      },
    });
    const result = await upsertCenterOwnerCredentials({
      centerId: "center-1",
      brandId: "brand-1",
      email: "owner@center.com",
      password: "secret1",
    });
    expect(result.error).toBe("Password must be at least 6 characters.");
  });

  it("regression_upsert_center_owner_credentials_surfaces_function_error", async () => {
    invokeMock.mockResolvedValue({
      data: { error: "Password required for a new franchise login" },
      error: null,
    });
    const result = await upsertCenterOwnerCredentials({
      centerId: "center-1",
      brandId: "brand-1",
      email: "new@center.com",
    });
    expect(result.error).toBe("Password required for a new franchise login");
  });
});

describe("shouldSyncCenterOwnerCredentials", () => {
  it("regression_skips_sync_for_profile_only_save_even_when_autofill_populates_email", () => {
    expect(
      shouldSyncCenterOwnerCredentials({
        loginEmail: "center@edunudg.com",
        password: "",
        originalLoginEmail: null,
        credentialsLoaded: true,
        loginFieldsTouched: false,
      })
    ).toBe(false);
  });

  it("syncs_when_password_field_was_edited", () => {
    expect(
      shouldSyncCenterOwnerCredentials({
        loginEmail: "owner@demo.com",
        password: "new-secret",
        originalLoginEmail: "owner@demo.com",
        credentialsLoaded: true,
        loginFieldsTouched: true,
      })
    ).toBe(true);
  });

  it("syncs_when_login_email_unchanged_case_insensitively", () => {
    expect(
      shouldSyncCenterOwnerCredentials({
        loginEmail: "Owner@Demo.com",
        password: "",
        originalLoginEmail: "owner@demo.com",
        credentialsLoaded: true,
        loginFieldsTouched: true,
      })
    ).toBe(false);
  });

  it("syncs_when_login_email_changed", () => {
    expect(
      shouldSyncCenterOwnerCredentials({
        loginEmail: "new-owner@demo.com",
        password: "secret",
        originalLoginEmail: "owner@demo.com",
        credentialsLoaded: true,
        loginFieldsTouched: true,
      })
    ).toBe(true);
  });
});
