import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import type { HomepageConfig } from "@/types/homepage";
import { centerPublicLoginHrefs } from "@/features/marketing/CenterPublicNavLogins";
import { MarketingSectionNavLink } from "@/features/marketing/MarketingSectionNavLink";
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
  const secondaryLabel = logins ? "" : config.nav.secondaryCtaLabel?.trim() || "";
  const secondaryHref = config.nav.secondaryCtaHref?.trim() || (secondaryLabel ? "apply" : "");
  const showSecondaryCta = Boolean(secondaryLabel && secondaryHref);
  const renderBrandMark = () =>
    logoUrl ? (
      <img src={logoUrl} alt="" className="sa-nav__logo-img" width={logins ? 64 : 40} height={logins ? 64 : 40} />
    ) : (
      <span className="sa-nav__logo-fallback">{config.meta.siteName.charAt(0)}</span>
    );

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
              className="sa-nav__drawer marketing-page--spark-academy"
              role="dialog"
              aria-modal="true"
              aria-label="Site menu"
            >
              <div className="sa-nav__drawer-head">
                <Link to="/" className="sa-nav__drawer-brand" onClick={closeMenu}>
                  {renderBrandMark()}
                  <span className="sa-nav__drawer-title">{config.meta.siteName}</span>
                </Link>
                <button type="button" className="sa-nav__drawer-close" aria-label="Close menu" onClick={closeMenu}>
                  ×
                </button>
              </div>
              <div className="sa-nav__drawer-links">
                {config.nav.links.map((link, i) => (
                  <MarketingSectionNavLink
                    key={`${link.label}-${i}`}
                    href={link.href}
                    label={link.label}
                    className="sa-nav__link"
                    onClick={closeMenu}
                  />
                ))}
                {logins ? (
                  <a href={logins.studentLoginHref} className="sa-nav__link" onClick={closeMenu}>
                    Student Login
                  </a>
                ) : null}
              </div>
              <div className="sa-nav__drawer-ctas">
                {showSecondaryCta ? (
                  <SparkAcademyCta
                    label={secondaryLabel}
                    href={secondaryHref}
                    variant="outline"
                    className="sa-nav__cta"
                    onClick={closeMenu}
                  />
                ) : null}
                <SparkAcademyCta
                  label={config.nav.ctaLabel}
                  href={config.nav.ctaHref}
                  variant="dark"
                  onClick={closeMenu}
                />
              </div>
            </div>
          </>,
          document.body
        )
      : null;

  return (
    <header className={`sa-nav${menuOpen ? " sa-nav--menu-open" : ""}${logins ? " sa-nav--franchise" : ""}`}>
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
            {renderBrandMark()}
            <span className="sa-nav__wordmark">{config.meta.siteName}</span>
          </Link>
        </div>

        <nav className="sa-nav__links" aria-label="Sections">
          {config.nav.links.map((link, i) => (
            <MarketingSectionNavLink
              key={`${link.label}-${i}`}
              href={link.href}
              label={link.label}
              className="sa-nav__link"
            />
          ))}
        </nav>

        <div className="sa-nav__actions">
          {logins ? (
            <a href={logins.studentLoginHref} className="sa-btn sa-btn--outline">
              Student Login
            </a>
          ) : null}
          {showSecondaryCta ? (
            <SparkAcademyCta
              label={secondaryLabel}
              href={secondaryHref}
              variant="outline"
              className="sa-nav__cta sa-nav__cta--header"
            />
          ) : null}
          <SparkAcademyCta label={config.nav.ctaLabel} href={config.nav.ctaHref} variant="dark" />
        </div>
      </div>

      {drawer}
    </header>
  );
}
