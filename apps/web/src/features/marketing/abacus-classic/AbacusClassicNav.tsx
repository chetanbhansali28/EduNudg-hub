import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { HomepageConfig } from "@/types/homepage";
import { centerPublicLoginHrefs } from "@/features/marketing/CenterPublicNavLogins";
import { AbacusCtaButton } from "./MarketingLeadModals";

type Props = {
  config: HomepageConfig;
  brandSlug?: string;
};

export function AbacusClassicNav({ config, brandSlug }: Props) {
  const logins = brandSlug ? centerPublicLoginHrefs(brandSlug) : null;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const menuWrapRef = useRef<HTMLDivElement>(null);
  const logoUrl = config.meta.logoUrl?.trim() || null;

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const secondaryLabel = config.nav.secondaryCtaLabel ?? "Apply franchise";
  const secondaryHref = config.nav.secondaryCtaHref ?? "apply";

  return (
    <header className="ac-nav">
      <div className="ac-nav__inner">
        <div className="ac-nav__brand" ref={menuWrapRef}>
          <button
            type="button"
            className="ac-nav__menu-toggle"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="ac-nav__menu-icon" aria-hidden />
          </button>

          {menuOpen ? (
            <div id={menuId} className="ac-nav__dropdown">
              {config.nav.links.map((link, i) => (
                <a key={`${link.label}-${i}`} href={link.href} onClick={() => setMenuOpen(false)}>
                  {link.label}
                </a>
              ))}
              {logins ? (
                <a href={logins.studentLoginHref} onClick={() => setMenuOpen(false)}>
                  Student Login
                </a>
              ) : null}
            </div>
          ) : null}

          <Link to="/" className="ac-nav__logo-link">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="ac-nav__logo-img" width={48} height={48} />
            ) : (
              <span className="ac-nav__logo-fallback">{config.meta.siteName.charAt(0)}</span>
            )}
            <span className="ac-nav__wordmark">{config.meta.siteName}</span>
          </Link>
        </div>

        <nav className="ac-nav__links" aria-label="Sections">
          {config.nav.links.map((link, i) => (
            <a key={`${link.label}-${i}`} href={link.href} className="ac-nav__link">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ac-nav__actions">
          {logins ? (
            <a href={logins.studentLoginHref} className="ac-nav__login-link ac-nav__login-link--student">
              Student Login
            </a>
          ) : null}
          <AbacusCtaButton label={config.nav.ctaLabel} href={config.nav.ctaHref} variant="nav-enroll" />
          <AbacusCtaButton label={secondaryLabel} href={secondaryHref} variant="nav-apply" />
        </div>
      </div>
    </header>
  );
}
