import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button, IconGoogle, IconWhatsApp, Input, LoginLayout, PasswordInput, ThemeProvider } from "@edunudg/ui";
import { useAuth } from "@/bootstrap/AuthProvider";
import { useTenant } from "@/bootstrap/TenantProvider";
import { useMembership } from "@/hooks/useMembership";
import { usePlatformIntegrations } from "@/hooks/usePlatformIntegration";
import { usePortalBranding } from "@/hooks/usePortalBranding";
import { useResolvedPortalTenant } from "@/hooks/useResolvedPortalTenant";
import { fetchHomepageConfig, MARKETING_HOMEPAGE_CONFIG_QUERY_KEY } from "@/lib/homepageApi";
import { hasPortalMembership } from "@/lib/portalMembership";
import { resolveLoginBranding } from "@/lib/portalBranding";
import { learnPortalLoginUrl } from "@/lib/centerPublicNavUrls";
import type { HomepageConfig } from "@/types/homepage";
import { postLoginPath } from "./postLoginPath";
import { formatLoginAccessDeniedMessage } from "./loginAccessMessage";
import { buildStaffOAuthRedirectUrl } from "@/services/auth/oauthRedirect";
import { resolveSafeInternalPath } from "@/lib/safeInternalPath";

const REMEMBER_KEY = "edunudg_remember_email";

export function LoginPage() {
  const { session, user, signInWithOAuth, signInWithEmail, signInWithOtpPhone, signInWithPasskey, signOut } =
    useAuth();
  const tenant = useTenant();
  const { tenant: portalTenant, isResolving: portalTenantResolving } = useResolvedPortalTenant();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const marketingOutlet = useOutletContext<{ marketingChrome?: true; config?: HomepageConfig } | undefined>();
  const inMarketingChrome = marketingOutlet?.marketingChrome === true;
  const { data: memberships, isLoading: membershipsLoading } = useMembership();
  const brandingQuery = usePortalBranding();
  const integrations = usePlatformIntegrations();
  const homepageQuery = useQuery({
    queryKey: MARKETING_HOMEPAGE_CONFIG_QUERY_KEY,
    queryFn: fetchHomepageConfig,
    enabled: tenant.portalType === "platform" && !inMarketingChrome,
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
  const [showWhatsappPhone, setShowWhatsappPhone] = useState(false);
  const accessDeniedHandled = useRef(false);

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

  const homepage = inMarketingChrome ? marketingOutlet?.config : homepageQuery.data;
  const portalType = tenant.portalType;
  const isStudentPortal = portalType === "learn" || portalType === "parents";
  const accessPending =
    portalTenantResolving || (!isStudentPortal && membershipsLoading);
  const hasAccess =
    !session || accessPending ? false : hasPortalMembership(memberships, portalTenant);

  const goAfterLogin = useCallback(() => {
    const path = resolveSafeInternalPath(searchParams.get("next"), postLoginPath({ portalType }));
    navigate(path, { replace: true });
  }, [navigate, portalType, searchParams]);

  useEffect(() => {
    if (!session || location.pathname !== "/login" || accessPending || !hasAccess) return;
    goAfterLogin();
  }, [session, location.pathname, accessPending, hasAccess, goAfterLogin]);

  useEffect(() => {
    if (isStudentPortal || accessPending) return;

    if (!session) {
      accessDeniedHandled.current = false;
      return;
    }

    if (hasAccess || accessDeniedHandled.current) return;

    accessDeniedHandled.current = true;
    const deniedEmail = user?.email ?? session.user.email;
    void signOut().finally(() => {
      setError(formatLoginAccessDeniedMessage(deniedEmail));
    });
  }, [session, user?.email, hasAccess, accessPending, isStudentPortal, signOut]);

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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in failed unexpectedly.");
    } finally {
      setSubmitting(false);
    }
  };

  const footerLinks = inMarketingChrome
    ? []
    : homepage
      ? [
          { label: "Terms", href: homepage.footer.termsHref },
          { label: "Privacy", href: homepage.footer.privacyHref },
          { label: "Help", href: "/help" },
        ]
      : undefined;

  const oauthRedirectTo = useMemo(() => {
    const query = searchParams.toString();
    return buildStaffOAuthRedirectUrl(query ? `?${query}` : "");
  }, [searchParams]);

  const showEmailAuth = integrations.auth_email;
  const showGoogleAuth = integrations.auth_google;
  const showFacebookAuth = integrations.auth_facebook;
  const showWhatsappAuth = integrations.auth_whatsapp_otp;
  const showPasskeyAuth = integrations.passkeys;
  const showSocialAuth = showGoogleAuth || showFacebookAuth || showWhatsappAuth;
  const showAlternateAuth = showSocialAuth || showPasskeyAuth;

  const form = (
    <div className={inMarketingChrome ? "ed-login-page--marketing" : undefined}>
      <LoginLayout
        branding={branding}
        footerLinks={footerLinks}
        hint={
          import.meta.env.DEV && tenant.portalType === "platform" ? (
            <>
              Dev: <code>admin@edunudg.com</code> / <code>admin1</code> → <code>/admin</code> after sign in.
            </>
          ) : import.meta.env.DEV && tenant.portalType === "center" && tenant.brandSlug ? (
            <>
              Staff: <code>center@edunudg.com</code> / <code>admin</code>. Parents and students use{" "}
              <a href={learnPortalLoginUrl(tenant.brandSlug)}>Student login</a>.
            </>
          ) : undefined
        }
      >
        {!showEmailAuth && !showAlternateAuth ? (
          <p className="ed-text-sm ed-muted">Sign-in is temporarily unavailable. Contact your administrator.</p>
        ) : null}

        {showEmailAuth ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleEmailSignIn();
            }}
          >
            <Input
              label="Email"
              value={email}
              onChange={setEmail}
              type="email"
              autoComplete="username"
              placeholder="name@company.com"
            />
            <PasswordInput
              label="Password"
              value={password}
              onChange={setPassword}
              placeholder="Enter your password"
            />

            <div className="ed-login-form__remember">
              <label htmlFor="login-remember">
                <input
                  id="login-remember"
                  name="remember"
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Remember me for 1 week
              </label>
              <a className="ed-login-form__forgot" href="#reset">
                Forgot password? <u>Reset it</u>
              </a>
            </div>

            <Button type="submit" disabled={submitting || !email.trim() || !password} block>
              {submitting ? "Signing in…" : "Log in"}
            </Button>
          </form>
        ) : null}

        {error && (
          <p role="alert" className="ed-login__error">
            {error}
          </p>
        )}

        {showEmailAuth && showAlternateAuth ? <div className="ed-login-form__divider">or</div> : null}

        {showAlternateAuth ? (
          <>
            {showSocialAuth ? (
              <div className="ed-login-form__oauth">
                {showGoogleAuth ? (
                  <Button
                    variant="oauth-google"
                    block
                    onClick={() =>
                      signInWithOAuth("google", { redirectTo: oauthRedirectTo }).catch((e) => setError(e.message))
                    }
                  >
                    <IconGoogle aria-hidden />
                    Log in with Google
                  </Button>
                ) : null}
                {showFacebookAuth ? (
                  <Button
                    variant="ghost"
                    block
                    onClick={() =>
                      signInWithOAuth("facebook", { redirectTo: oauthRedirectTo }).catch((e) => setError(e.message))
                    }
                  >
                    Log in with Facebook
                  </Button>
                ) : null}
                {showWhatsappAuth ? (
                  <>
                    {showWhatsappPhone ? (
                      <Input label="Mobile number" value={phone} onChange={setPhone} placeholder="9890200000" />
                    ) : null}
                    <Button
                      variant="oauth-whatsapp"
                      block
                      onClick={async () => {
                        if (!showWhatsappPhone) {
                          setShowWhatsappPhone(true);
                          return;
                        }
                        const { error: err } = await signInWithOtpPhone(phone);
                        setError(err?.message ?? "OTP sent — check WhatsApp");
                      }}
                    >
                      <IconWhatsApp aria-hidden />
                      Log in with WhatsApp
                    </Button>
                  </>
                ) : null}
              </div>
            ) : null}
            {showPasskeyAuth ? (
              <Button
                variant="secondary"
                block
                disabled={submitting}
                onClick={async () => {
                  setSubmitting(true);
                  setError(null);
                  try {
                    const { error: err } = await signInWithPasskey();
                    if (err) setError(err.message);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Passkey sign-in failed.");
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                Log in with passkey
              </Button>
            ) : null}
          </>
        ) : null}

        {tenant.portalType === "platform" && !inMarketingChrome ? (
          <p className="ed-login-form__extra">
            <Link to="/">← Back to homepage</Link>
          </p>
        ) : null}
        {tenant.portalType === "center" && tenant.brandSlug ? (
          <p className="ed-login-form__extra">
            Parent or student?{" "}
            <a href={learnPortalLoginUrl(tenant.brandSlug)}>Sign in to the student portal</a>
            {" · "}
            <Link to="/">← Center homepage</Link>
          </p>
        ) : null}
      </LoginLayout>
    </div>
  );

  if (inMarketingChrome) return form;
  return <ThemeProvider>{form}</ThemeProvider>;
}
