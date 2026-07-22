import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button, ThemeProvider } from "@edunudg/ui";
import { getSupabase } from "@/lib/supabase";
import {
  parsePortalOverrideFromSearch,
  portalOverrideSearchParams,
  writePortalOverride,
} from "@/lib/portalOverride";

/**
 * Completes platform-admin portal handoff on the target host via verifyOtp.
 * Avoids Supabase action_link redirects (which fall back to Site URL when subdomains are not allowlisted).
 * On single-host deploys (e.g. *.vercel.app), persists ?portal=&brand= override for TenantProvider.
 */
export function AuthHandoffPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tokenHash = searchParams.get("token_hash")?.trim();
    const next = searchParams.get("next")?.trim() || "/";

    if (!tokenHash) {
      setError("This sign-in link is incomplete. Open the portal again from the admin Brands page.");
      return;
    }

    let cancelled = false;

    void (async () => {
      const { error: verifyError } = await getSupabase().auth.verifyOtp({
        token_hash: tokenHash,
        type: "magiclink",
      });

      if (cancelled) return;

      if (verifyError) {
        setError(verifyError.message || "Could not complete portal sign-in.");
        return;
      }

      const override = parsePortalOverrideFromSearch(searchParams.toString());
      if (override) writePortalOverride(override);

      const path = next.startsWith("/") ? next : `/${next}`;
      const qs = override ? `?${portalOverrideSearchParams(override).toString()}` : "";
      navigate(`${path}${qs}`, { replace: true });
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, searchParams]);

  return (
    <ThemeProvider>
      <div className="ed-login">
        {error ? (
          <>
            <p className="ed-text-sm" role="alert">
              {error}
            </p>
            <p className="ed-text-sm ed-muted" style={{ marginTop: "0.75rem" }}>
              Try <strong>Open</strong> or <strong>Brand backend</strong> again from the platform admin Brands
              page while signed in as platform admin.
            </p>
            <div style={{ marginTop: "1rem" }}>
              <Link to="/login">
                <Button variant="ghost">Go to login</Button>
              </Link>
            </div>
          </>
        ) : (
          <p className="ed-empty">Signing you in…</p>
        )}
      </div>
    </ThemeProvider>
  );
}
