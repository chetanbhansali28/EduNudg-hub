import { beforeEach, describe, expect, it, vi } from "vitest";
import { openPortalAsPlatformAdmin } from "./portalHandoffApi";

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
      value: { protocol: "http:", hostname: "localhost", port: "9000" },
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
});
