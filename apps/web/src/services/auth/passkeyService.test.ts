import { describe, expect, it, vi, beforeEach } from "vitest";
import { signInWithPasskey } from "./passkeyService";

const { invokeMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    functions: { invoke: invokeMock },
  }),
}));

describe("passkeyService", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    Object.defineProperty(window, "PublicKeyCredential", {
      configurable: true,
      value: class PublicKeyCredential {},
    });
  });

  it("returns error when passkey edge function is not configured", async () => {
    invokeMock.mockResolvedValue({
      data: { configured: false, message: "Passkey sign-in is not fully configured." },
      error: null,
    });

    const result = await signInWithPasskey();
    expect(result.error?.message).toContain("not fully configured");
    expect(invokeMock).toHaveBeenCalledWith("passkey-verify", {
      body: { action: "login-options" },
    });
  });

  it("returns error when browser lacks WebAuthn support", async () => {
    Object.defineProperty(window, "PublicKeyCredential", {
      configurable: true,
      value: undefined,
    });

    const result = await signInWithPasskey();
    expect(result.error?.message).toContain("not supported");
    expect(invokeMock).not.toHaveBeenCalled();
  });
});
