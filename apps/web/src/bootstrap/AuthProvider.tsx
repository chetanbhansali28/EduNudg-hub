import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { clearCenterHealthReminders } from "@/lib/centerHealthReminder";
import { buildStaffOAuthRedirectUrl } from "@/services/auth/oauthRedirect";
import { reportAuthAudit } from "@/services/auth/authAuditApi";
import { signInWithPasskey as passkeySignIn } from "@/services/auth/passkeyService";
import { useTenant } from "@/bootstrap/TenantProvider";

export type SignOutAudit = "logout" | "access_denied" | "none";

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithOAuth: (
    provider: "google" | "facebook",
    options?: { redirectTo?: string }
  ) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithOtpPhone: (phone: string) => Promise<{ error: Error | null }>;
  signInWithPasskey: () => Promise<{ error: Error | null }>;
  signOut: (options?: { audit?: SignOutAudit }) => Promise<void>;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const tenant = useTenant();
  const tenantRef = useRef(tenant);
  tenantRef.current = tenant;
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    try {
      const supabase = getSupabase();
      supabase.auth
        .getSession()
        .then(({ data }) => {
          if (!cancelled) setSession(data.session);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
        if (!cancelled) setSession(s);
        if (cancelled || event !== "SIGNED_IN" || !s) return;
        void reportAuthAudit({
          eventType: "login_success",
          tenant: tenantRef.current,
          session: s,
        });
      });
      return () => {
        cancelled = true;
        sub.subscription.unsubscribe();
      };
    } catch {
      setLoading(false);
      return undefined;
    }
  }, []);

  const signInWithOAuth = async (
    provider: "google" | "facebook",
    options?: { redirectTo?: string }
  ) => {
    const redirectTo = options?.redirectTo ?? buildStaffOAuthRedirectUrl(window.location.search);
    const { error } = await getSupabase().auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (error) throw error;
  };

  const signInWithEmail = async (email: string, password: string) => {
    const trimmed = email.trim().toLowerCase();
    try {
      const { error } = await getSupabase().auth.signInWithPassword({
        email: trimmed,
        password,
      });
      if (error) {
        await reportAuthAudit({
          eventType: "login_failure",
          tenant: tenantRef.current,
          provider: "email",
          identifier: trimmed,
        });
        return { error: new Error(error.message) };
      }
      return { error: null };
    } catch (e) {
      await reportAuthAudit({
        eventType: "login_failure",
        tenant: tenantRef.current,
        provider: "email",
        identifier: trimmed,
      });
      return { error: e instanceof Error ? e : new Error("Sign in failed") };
    }
  };

  const signInWithOtpPhone = async (phone: string) => {
    const { error } = await getSupabase().auth.signInWithOtp({ phone });
    if (error) {
      void reportAuthAudit({
        eventType: "login_failure",
        tenant: tenantRef.current,
        provider: "whatsapp",
        identifier: phone.trim(),
      });
    }
    return { error: error as Error | null };
  };

  const signInWithPasskey = async () => passkeySignIn();

  const signOut = async (options?: { audit?: SignOutAudit }) => {
    const mode = options?.audit ?? "logout";
    const current = session;
    if (mode === "access_denied" && current) {
      await reportAuthAudit({
        eventType: "access_denied",
        tenant: tenantRef.current,
        session: current,
      });
    } else if (mode === "logout" && current) {
      await reportAuthAudit({
        eventType: "logout",
        tenant: tenantRef.current,
        session: current,
      });
    }
    await getSupabase().auth.signOut();
    clearCenterHealthReminders();
  };

  return (
    <AuthCtx.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signInWithOAuth,
        signInWithEmail,
        signInWithOtpPhone,
        signInWithPasskey,
        signOut,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
