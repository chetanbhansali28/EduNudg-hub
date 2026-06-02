import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithOAuth: (provider: "google" | "facebook") => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithOtpPhone: (phone: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
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
      const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
        if (!cancelled) setSession(s);
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

  const signInWithOAuth = async (provider: "google" | "facebook") => {
    const { error } = await getSupabase().auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await getSupabase().auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      return { error: error ? new Error(error.message) : null };
    } catch (e) {
      return { error: e instanceof Error ? e : new Error("Sign in failed") };
    }
  };

  const signInWithOtpPhone = async (phone: string) => {
    const { error } = await getSupabase().auth.signInWithOtp({ phone });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await getSupabase().auth.signOut();
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
