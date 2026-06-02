import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  mergeDomainMapping,
  resolveTenantFromHost,
  type DomainMappingRow,
  type TenantContext,
} from "@edunudg/tenant";
import { getSupabase } from "@/lib/supabase";

const TenantCtx = createContext<TenantContext | null>(null);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<TenantContext>(() =>
    resolveTenantFromHost(window.location.hostname)
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const base = resolveTenantFromHost(window.location.hostname);
    const timeout = setTimeout(() => {
      setTenant(base);
      setLoading(false);
    }, 2000);

    let supabase: ReturnType<typeof getSupabase>;
    try {
      supabase = getSupabase();
    } catch {
      clearTimeout(timeout);
      setTenant(base);
      setLoading(false);
      return;
    }

    void (async () => {
      try {
        const { data, error } = await supabase
          .from("domain_mappings")
          .select("hostname, portal_type, brand_id, center_id")
          .eq("hostname", base.hostname)
          .maybeSingle();

        if (!error) {
          setTenant(mergeDomainMapping(base, data as DomainMappingRow | null));
        } else {
          setTenant(base);
        }
      } catch {
        setTenant(base);
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
