import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { HomepageConfig } from "@/types/homepage";
import { centerPublicLoginHrefs } from "@/features/marketing/CenterPublicNavLogins";
import { SparkAcademyCta } from "./SparkAcademyCta";

type Props = {
  config: HomepageConfig;
  brandSlug?: string;
};

export function SparkAcademyNav({ config, brandSlug }: Props) {
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

  return (
    <header className="sa-nav">
      <div className="sa-nav__inner">
        <div className="sa-nav__brand" ref={menuWrapRef}>
          <button
            type="button"
            className="sa-nav__menu-toggle"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="sa-nav__menu-icon" aria-hidden />
          </button>

          {menuOpen ? (
            <div id={menuId} className="sa-nav__dropdown">
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

          <Link to="/" className="sa-nav__logo-link">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="sa-nav__logo-img" width={40} height={40} />
            ) : (
              <span className="sa-nav__logo-fallback">{config.meta.siteName.charAt(0)}</span>
            )}
            <span className="sa-nav__wordmark">{config.meta.siteName}</span>
          </Link>
        </div>

        <nav className="sa-nav__links" aria-label="Sections">
          {config.nav.links.map((link, i) => (
            <a key={`${link.label}-${i}`} href={link.href} className="sa-nav__link">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="sa-nav__actions">
          {logins ? (
            <a href={logins.studentLoginHref} className="sa-btn sa-btn--outline">
              Student Login
            </a>
          ) : (
            <Link to={config.nav.adminHref} className="sa-btn sa-btn--outline">
              Login
            </Link>
          )}
          <SparkAcademyCta label={config.nav.ctaLabel} href={config.nav.ctaHref} variant="dark" />
        </div>
      </div>
    </header>
  );
}
