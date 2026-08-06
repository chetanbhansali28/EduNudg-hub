import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
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
  const logoUrl = config.meta.logoUrl?.trim() || null;

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  useEffect(() => {
    document.body.classList.toggle("sa-nav-drawer-open", menuOpen);
    return () => document.body.classList.remove("sa-nav-drawer-open");
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const drawer =
    menuOpen && typeof document !== "undefined"
      ? createPortal(
          <>
            <button
              type="button"
              className="sa-nav__drawer-backdrop"
              aria-label="Close menu"
              onClick={closeMenu}
            />
            <div
              id={menuId}
              className="sa-nav__drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Site menu"
            >
              <div className="sa-nav__drawer-head">
                <span className="sa-nav__drawer-title">{config.meta.siteName}</span>
                <button type="button" className="sa-nav__drawer-close" aria-label="Close menu" onClick={closeMenu}>
                  ×
                </button>
              </div>
              <div className="sa-nav__drawer-links">
                {config.nav.links.map((link, i) => (
                  <a key={`${link.label}-${i}`} href={link.href} onClick={closeMenu}>
                    {link.label}
                  </a>
                ))}
                {logins ? (
                  <a href={logins.studentLoginHref} onClick={closeMenu}>
                    Student Login
                  </a>
                ) : null}
              </div>
            </div>
          </>,
          document.body
        )
      : null;

  return (
    <header className={`sa-nav${menuOpen ? " sa-nav--menu-open" : ""}`}>
      <div className="sa-nav__inner">
        <div className="sa-nav__brand">
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

      {drawer}
    </header>
  );
}
