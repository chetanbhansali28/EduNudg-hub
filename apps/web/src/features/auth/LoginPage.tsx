import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button, IconGoogle, Input, LoginLayout, PasswordInput, ThemeProvider } from "@edunudg/ui";
import { useAuth } from "@/bootstrap/AuthProvider";
import { useTenant } from "@/bootstrap/TenantProvider";
import { usePortalBranding } from "@/hooks/usePortalBranding";
import { fetchHomepageConfig } from "@/lib/homepageApi";
import { resolveLoginBranding } from "@/lib/portalBranding";
import { postLoginPath } from "./postLoginPath";

const REMEMBER_KEY = "edunudg_remember_email";

export function LoginPage() {
  const { session, signInWithOAuth, signInWithEmail, signInWithOtpPhone } = useAuth();
  const tenant = useTenant();
  const navigate = useNavigate();
  const brandingQuery = usePortalBranding();
  const homepageQuery = useQuery({
    queryKey: ["marketing-homepage"],
    queryFn: fetchHomepageConfig,
    enabled: tenant.portalType === "platform",
  });

  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem(REMEMBER_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [remember, setRemember] = useState(() => {
    try {
      return Boolean(localStorage.getItem(REMEMBER_KEY));
    } catch {
      return false;
    }
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showAltSignIn, setShowAltSignIn] = useState(false);

  const branding = useMemo(
    () =>
      resolveLoginBranding(
        tenant.portalType,
        brandingQuery.data ?? {
          brandId: null,
          brandSlug: null,
          brandName: null,
          brandLogoUrl: null,
          centerId: null,
          centerSlug: null,
          centerName: null,
          loginHeadline: null,
          loginSubtext: null,
        },
        tenant.brandSlug,
        tenant.centerSlug
      ),
    [tenant.portalType, tenant.brandSlug, tenant.centerSlug, brandingQuery.data]
  );

  const homepage = homepageQuery.data;

  const goAfterLogin = useCallback(() => {
    navigate(postLoginPath(tenant), { replace: true });
  }, [navigate, tenant]);

  useEffect(() => {
    if (session) goAfterLogin();
  }, [session, goAfterLogin]);

  const handleEmailSignIn = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Enter email and password.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      if (remember) {
        localStorage.setItem(REMEMBER_KEY, trimmedEmail);
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }

      const { error: err } = await signInWithEmail(trimmedEmail, password);
      if (err) {
        setError(err.message || "Sign in failed. Check email and password.");
        return;
      }
      goAfterLogin();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in failed unexpectedly.");
    } finally {
      setSubmitting(false);
    }
  };

  const legal = homepage ? (
    <>
      By logging in, you agree to our{" "}
      <a href={homepage.footer.privacyHref}>Privacy Policy</a> and{" "}
      <a href={homepage.footer.termsHref}>Terms &amp; Conditions</a>.
    </>
  ) : tenant.portalType === "platform" ? (
    <>
      By logging in, you agree to our <a href="/#faq">Privacy Policy</a> and{" "}
      <a href="/#faq">Terms &amp; Conditions</a>.
    </>
  ) : null;

  return (
    <ThemeProvider>
      <LoginLayout
        branding={branding}
        hint={
          import.meta.env.DEV && tenant.portalType === "platform" ? (
            <>
              Dev: <code>admin@edunudg.com</code> / <code>admin</code> → <code>/admin</code> after sign in.
            </>
          ) : undefined
        }
        legal={legal}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleEmailSignIn();
          }}
        >
          <Input label="Email" value={email} onChange={setEmail} type="email" autoComplete="username" />
          <PasswordInput label="Password" value={password} onChange={setPassword} />

          <div className="ed-login-split__remember">
            <label>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Remember me for 1 week
            </label>
            <a className="ed-login-split__forgot" href="#reset">
              Forgot password? <u>Reset it</u>
            </a>
          </div>

          <Button type="submit" disabled={submitting || !email.trim() || !password} block>
            {submitting ? "Signing in…" : "Log in"}
          </Button>
        </form>

        {error && (
          <p role="alert" className="ed-login__error">
            {error}
          </p>
        )}

        <div className="ed-login-split__divider">or continue with</div>

        {!showAltSignIn ? (
          <Button variant="ghost" block onClick={() => setShowAltSignIn(true)}>
            More sign-in options
          </Button>
        ) : (
          <div className="ed-login-split__oauth">
            <Button onClick={() => signInWithOAuth("google").catch((e) => setError(e.message))}>
              <IconGoogle aria-hidden />
              Google
            </Button>
            <Button variant="ghost" onClick={() => signInWithOAuth("facebook").catch((e) => setError(e.message))}>
              Facebook
            </Button>
            <Input label="Mobile (+91…)" value={phone} onChange={setPhone} placeholder="+919876543210" />
            <Button
              variant="ghost"
              block
              onClick={async () => {
                const { error: err } = await signInWithOtpPhone(phone);
                setError(err?.message ?? "OTP sent — check WhatsApp");
              }}
            >
              Send OTP via WhatsApp
            </Button>
          </div>
        )}

        {tenant.portalType === "platform" && (
          <p className="ed-login-split__subtitle" style={{ marginTop: "1.25rem" }}>
            <Link to="/">← Back to homepage</Link>
          </p>
        )}
      </LoginLayout>
    </ThemeProvider>
  );
}
