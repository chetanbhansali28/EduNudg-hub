import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  deletePasskey,
  listPasskeys,
  registerPasskey,
  signInWithPasskey,
} from "./passkeyService";

const { invokeMock, verifyOtpMock, startAuthenticationMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
  verifyOtpMock: vi.fn(),
  startAuthenticationMock: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    functions: { invoke: invokeMock },
    auth: { verifyOtp: verifyOtpMock },
  }),
}));

vi.mock("@simplewebauthn/browser", () => ({
  startAuthentication: (...args: unknown[]) => startAuthenticationMock(...args),
  startRegistration: vi.fn(),
}));

describe("passkeyService", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    verifyOtpMock.mockReset();
    startAuthenticationMock.mockReset();
    Object.defineProperty(window, "PublicKeyCredential", {
      configurable: true,
      value: class PublicKeyCredential {},
    });
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { origin: "http://localhost:9000" },
    });
  });

  it("returns error when passkey edge function is not configured", async () => {
    invokeMock.mockResolvedValue({
      data: null,
      error: {
        message: "Edge Function returned a non-2xx status code",
        context: new Response(JSON.stringify({ error: "Passkey sign-in is not fully configured." })),
      },
    });

    const result = await signInWithPasskey();
    expect(result.error?.message).toContain("not fully configured");
    expect(invokeMock).toHaveBeenCalledWith("passkey-verify", {
      body: { action: "login-options", origin: "http://localhost:9000" },
    });
  });

  it("regression_passkey_login_completes_session_with_token_hash", async () => {
    invokeMock
      .mockResolvedValueOnce({
        data: { configured: true, options: { challenge: "abc", timeout: 60000 } },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { configured: true, tokenHash: "hash-123" },
        error: null,
      });
    startAuthenticationMock.mockResolvedValue({
      id: "cred-id",
      rawId: "cred-id",
      response: {
        clientDataJSON: btoa(JSON.stringify({ challenge: "abc" })),
        authenticatorData: "aa",
        signature: "sig",
      },
      type: "public-key",
      clientExtensionResults: {},
    });
    verifyOtpMock.mockResolvedValue({ error: null });

    const result = await signInWithPasskey();
    expect(result.error).toBeNull();
    expect(verifyOtpMock).toHaveBeenCalledWith({ token_hash: "hash-123", type: "magiclink" });
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

  it("listPasskeys returns credentials from edge function", async () => {
    invokeMock.mockResolvedValue({
      data: {
        configured: true,
        credentials: [{ credential_id: "id-1", device_name: "Phone", created_at: "2026-01-01", transports: [] }],
      },
      error: null,
    });

    const result = await listPasskeys();
    expect(result.error).toBeNull();
    expect(result.credentials).toHaveLength(1);
  });

  it("deletePasskey invokes delete action", async () => {
    invokeMock.mockResolvedValue({ data: { configured: true, ok: true }, error: null });
    const result = await deletePasskey("cred-1");
    expect(result.error).toBeNull();
    expect(invokeMock).toHaveBeenCalledWith("passkey-verify", {
      body: { action: "delete", origin: "http://localhost:9000", credentialId: "cred-1" },
    });
  });

  it("registerPasskey surfaces edge errors", async () => {
    invokeMock.mockResolvedValue({ data: { error: "Sign in required." }, error: null });
    const result = await registerPasskey();
    expect(result.error?.message).toContain("Sign in required");
  });
});
