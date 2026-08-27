import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthProvider";

const reportAuthAudit = vi.fn().mockResolvedValue(undefined);
const signInWithPassword = vi.fn();
const signOutAuth = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/bootstrap/TenantProvider", () => ({
  useTenant: () => ({
    portalType: "platform",
    hostname: "localhost",
    brandId: null,
    centerId: null,
    brandSlug: null,
    centerSlug: null,
  }),
}));

vi.mock("@/services/auth/authAuditApi", () => ({
  reportAuthAudit: (...args: unknown[]) => reportAuthAudit(...args),
}));

vi.mock("@/services/auth/passkeyService", () => ({
  signInWithPasskey: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithPassword,
      signOut: signOutAuth,
      signInWithOAuth: vi.fn(),
      signInWithOtp: vi.fn(),
    },
  }),
}));

function SignInProbe() {
  const { signInWithEmail } = useAuth();
  return (
    <button type="button" onClick={() => void signInWithEmail("Admin@edunudg.com", "wrong")}>
      fail-login
    </button>
  );
}

describe("AuthProvider auth audit", () => {
  beforeEach(() => {
    reportAuthAudit.mockClear();
    signInWithPassword.mockReset();
    signOutAuth.mockClear();
  });

  it("regression_failed_email_login_reports_login_failure", async () => {
    signInWithPassword.mockResolvedValue({ error: { message: "Invalid login credentials" } });
    render(
      <AuthProvider>
        <SignInProbe />
      </AuthProvider>
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "fail-login" }));
    });
    expect(reportAuthAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "login_failure",
        identifier: "admin@edunudg.com",
        provider: "email",
      })
    );
  });
});
