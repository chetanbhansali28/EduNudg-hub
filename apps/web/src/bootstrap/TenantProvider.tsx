import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { TenantContext } from "@edunudg/tenant";
import { resolveTenantFromHost } from "@edunudg/tenant";
import { getSupabase } from "@/lib/supabase";
import { resolveTenantScope } from "@/lib/resolveTenantScope";

const TenantCtx = createContext<TenantContext | null>(null);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<TenantContext>(() =>
    resolveTenantFromHost(window.location.hostname)
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hostname = window.location.hostname;
    const timeout = setTimeout(() => setLoading(false), 2000);

    let supabase: ReturnType<typeof getSupabase>;
    try {
      supabase = getSupabase();
    } catch {
      clearTimeout(timeout);
      setTenant(resolveTenantFromHost(hostname));
      setLoading(false);
      return;
    }

    void (async () => {
      try {
        const resolved = await resolveTenantScope(supabase, hostname);
        setTenant(resolved);
      } catch {
        setTenant(resolveTenantFromHost(hostname));
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    })();

    return () => clearTimeout(timeout);
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        Loading EduNudg…
      </div>
    );
  }

  return <TenantCtx.Provider value={tenant}>{children}</TenantCtx.Provider>;
}

export function useTenant(): TenantContext {
  const ctx = useContext(TenantCtx);
  if (!ctx) throw new Error("useTenant must be used within TenantProvider");
  return ctx;
}
