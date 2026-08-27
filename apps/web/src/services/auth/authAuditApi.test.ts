import { describe, expect, it, vi, beforeEach } from "vitest";
import { providerFromSession, reportAuthAudit, sanitizeAuthAuditMetadata } from "./authAuditApi";
import type { Session } from "@supabase/supabase-js";

const invoke = vi.fn();
const rpc = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    functions: { invoke },
    rpc,
  }),
}));

const tenant = {
  portalType: "platform" as const,
  brandId: null,
  centerId: null,
  hostname: "localhost",
};

function session(overrides: Partial<Session> = {}): Session {
  return {
    access_token: "hdr.eyJzaWduIjoiIn0.sig",
    refresh_token: "r",
    expires_in: 3600,
    expires_at: 1,
    token_type: "bearer",
    user: {
      id: "user-1",
      email: "admin@edunudg.com",
      app_metadata: { provider: "email" },
      user_metadata: {},
      aud: "authenticated",
      created_at: "",
    },
    ...overrides,
  } as Session;
}

describe("authAuditApi", () => {
  beforeEach(() => {
    invoke.mockReset();
    rpc.mockReset();
    invoke.mockResolvedValue({ data: { ok: true }, error: null });
    rpc.mockResolvedValue({ data: "id-1", error: null });
  });

  it("strips passwords and tokens from metadata", () => {
    const clean = sanitizeAuthAuditMetadata({
      password: "secret",
      hostname: "localhost",
      access_token: "jwt",
    });
    expect(clean.password).toBeUndefined();
    expect(clean.access_token).toBeUndefined();
    expect(clean.hostname).toBe("localhost");
  });

  it("maps google identity to provider", () => {
    expect(
      providerFromSession(
        session({
          user: {
            id: "user-1",
            app_metadata: { provider: "google" },
            user_metadata: {},
            aud: "authenticated",
            created_at: "",
          } as Session["user"],
        })
      )
    ).toBe("google");
  });

  it("regression_auth_audit_falls_back_to_rpc_when_function_missing", async () => {
    invoke.mockResolvedValue({ data: null, error: { message: "Function not found" } });
    await reportAuthAudit({
      eventType: "login_failure",
      tenant,
      identifier: "Admin@edunudg.com",
      provider: "email",
    });
    expect(rpc).toHaveBeenCalledWith(
      "log_auth_audit_event",
      expect.objectContaining({
        p_event_type: "login_failure",
        p_identifier: "admin@edunudg.com",
      })
    );
  });

  it("regression_auth_audit_never_throws", async () => {
    invoke.mockRejectedValue(new Error("offline"));
    rpc.mockRejectedValue(new Error("offline"));
    await expect(
      reportAuthAudit({ eventType: "logout", tenant, session: session() })
    ).resolves.toBeUndefined();
  });
});
