import { beforeEach, describe, expect, it, vi } from "vitest";
import { ensureSameOriginHandoffParams, openPortalAsPlatformAdmin } from "./portalHandoffApi";

const invokeMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    functions: { invoke: invokeMock },
  }),
}));

describe("portalHandoffApi", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    vi.stubGlobal("open", vi.fn());
    Object.defineProperty(window, "location", {
      value: { protocol: "http:", hostname: "localhost", port: "9000", origin: "http://localhost:9000" },
      writable: true,
    });
  });

  it("regression_openPortalAsPlatformAdmin_requests_magic_link", async () => {
    invokeMock.mockResolvedValue({
      data: { url: "https://auth.example/magic" },
      error: null,
    });

    await openPortalAsPlatformAdmin({
      portalType: "brand",
      brandSlug: "smart-brain-abacus",
      hostname: "smart-brain-abacus.localhost",
    });

    expect(invokeMock).toHaveBeenCalledWith("platform-portal-handoff", {
      body: {
        redirectTo: "http://smart-brain-abacus.localhost:9000/auth/handoff?next=%2Fapp",
      },
    });
    expect(window.open).toHaveBeenCalledWith("https://auth.example/magic", "_blank", "noopener,noreferrer");
  });

  it("regression_vercel_handoff_url_rehydrates_missing_portal_params", async () => {
    Object.defineProperty(window, "location", {
      value: {
        protocol: "https:",
        hostname: "edunudg-hub.vercel.app",
        port: "",
        origin: "https://edunudg-hub.vercel.app",
      },
      writable: true,
    });
    invokeMock.mockResolvedValue({
      data: { url: "https://edunudg-hub.vercel.app/auth/handoff?token_hash=abc&next=%2Fapp" },
      error: null,
    });

    await openPortalAsPlatformAdmin({
      portalType: "brand",
      brandSlug: "demo",
      hostname: "demo.localhost",
    });

    expect(window.open).toHaveBeenCalledWith(
      "https://edunudg-hub.vercel.app/auth/handoff?token_hash=abc&next=%2Fapp&portal=brand&brand=demo",
      "_blank",
      "noopener,noreferrer"
    );
  });

  it("regression_ensureSameOriginHandoffParams_is_noop_on_localhost", () => {
    expect(
      ensureSameOriginHandoffParams("https://auth.example/magic", {
        portalType: "brand",
        brandSlug: "demo",
      })
    ).toBe("https://auth.example/magic");
  });
});
