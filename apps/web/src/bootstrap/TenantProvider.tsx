import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { TenantContext } from "@edunudg/tenant";
import { isPlatformHost, resolveTenantFromHost } from "@edunudg/tenant";
import { getSupabase } from "@/lib/supabase";
import { resolveTenantScope } from "@/lib/resolveTenantScope";
import {
  clearPortalOverride,
  readPortalOverride,
  syntheticLookupHostname,
  type PortalOverride,
} from "@/lib/portalOverride";

const TenantCtx = createContext<TenantContext | null>(null);

function lookupHostnameForResolution(override: PortalOverride | null): string {
  const host = window.location.hostname;
  if (!override) return host;
  // Same-origin / platform hosts: resolve against synthetic *.localhost mappings in DB.
  if (isPlatformHost(host)) {
    return syntheticLookupHostname(override);
  }
  return host;
}

function activePortalOverride(): PortalOverride | null {
  const hostname = window.location.hostname;
  const path = window.location.pathname;
  // Platform admin shell must stay on platform portal even if a sticky override exists.
  if (path.startsWith("/admin") && isPlatformHost(hostname)) {
    clearPortalOverride();
    return null;
  }
  return readPortalOverride();
}

function initialTenant(): TenantContext {
  return resolveTenantFromHost(lookupHostnameForResolution(activePortalOverride()));
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<TenantContext>(initialTenant);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const override = activePortalOverride();
    const effectiveLookup = lookupHostnameForResolution(override);
    const timeout = setTimeout(() => setLoading(false), 2000);

    let supabase: ReturnType<typeof getSupabase>;
    try {
      supabase = getSupabase();
    } catch {
      clearTimeout(timeout);
      setTenant(resolveTenantFromHost(effectiveLookup));
      setLoading(false);
      return;
    }

    void (async () => {
      try {
        const resolved = await resolveTenantScope(supabase, effectiveLookup);
        setTenant(resolved);
      } catch {
        setTenant(resolveTenantFromHost(effectiveLookup));
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
