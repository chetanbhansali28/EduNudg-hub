import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import type { HomepageConfig } from "@/types/homepage";
import { centerPublicLoginHrefs } from "@/features/marketing/CenterPublicNavLogins";
import { MarketingSectionNavLink } from "@/features/marketing/MarketingSectionNavLink";
import { EduLearnCta } from "./EduLearnCta";

type Props = {
  config: HomepageConfig;
  brandSlug?: string;
};

export function EduLearnNav({ config, brandSlug }: Props) {
  const logins = brandSlug ? centerPublicLoginHrefs(brandSlug) : null;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const logoUrl = config.meta.logoUrl?.trim() || null;
  const secondaryLabel = logins ? "" : config.nav.secondaryCtaLabel?.trim() || "";
  const secondaryHref = config.nav.secondaryCtaHref?.trim() || (secondaryLabel ? "apply" : "");
  const showSecondaryCta = Boolean(secondaryLabel && secondaryHref);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  useEffect(() => {
    document.body.classList.toggle("el-nav-drawer-open", menuOpen);
    return () => document.body.classList.remove("el-nav-drawer-open");
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);
  const mark = logoUrl ? (
    <img src={logoUrl} alt="" className="el-nav__logo-img" width={logins ? 56 : 38} height={logins ? 56 : 38} />
  ) : (
    <span className="el-nav__logo-fallback">{config.meta.siteName.charAt(0)}</span>
  );

  const drawer =
    menuOpen && typeof document !== "undefined"
      ? createPortal(
          <>
            <button type="button" className="el-nav__drawer-backdrop" aria-label="Close menu" onClick={closeMenu} />
            <div
              id={menuId}
              className="el-nav__drawer marketing-page--edu-learn"
              role="dialog"
              aria-modal="true"
              aria-label="Site menu"
            >
              <div className="el-nav__drawer-head">
                <Link to="/" className="el-nav__drawer-brand" onClick={closeMenu}>
                  {mark}
                  <span>{config.meta.siteName}</span>
                </Link>
                <button type="button" className="el-nav__drawer-close" aria-label="Close menu" onClick={closeMenu}>
                  ×
                </button>
              </div>
              <div className="el-nav__drawer-links">
                {config.nav.links.map((link, i) => (
                  <MarketingSectionNavLink
                    key={`${link.label}-${i}`}
                    href={link.href}
                    label={link.label}
                    className="el-nav__link"
                    onClick={closeMenu}
                  />
                ))}
                {logins ? (
                  <a href={logins.studentLoginHref} className="el-nav__link" onClick={closeMenu}>
                    Student Login
                  </a>
                ) : null}
              </div>
              <div className="el-nav__drawer-ctas">
                {showSecondaryCta ? (
                  <EduLearnCta label={secondaryLabel} href={secondaryHref} onClick={closeMenu} />
                ) : null}
                <EduLearnCta
                  label={config.nav.ctaLabel}
                  href={config.nav.ctaHref}
                  variant="outline"
                  onClick={closeMenu}
                />
              </div>
            </div>
          </>,
          document.body
        )
      : null;

  return (
    <header className={`el-nav${logins ? " el-nav--franchise" : ""}`}>
      <div className="el-nav__inner">
        <div className="el-nav__brand">
          <button
            type="button"
            className="el-nav__menu-toggle"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="el-nav__menu-icon" aria-hidden />
          </button>
          <Link to="/" className="el-nav__logo-link">
            {mark}
            <span className="el-nav__wordmark">{config.meta.siteName}</span>
          </Link>
        </div>
        <nav className="el-nav__links" aria-label="Sections">
          {config.nav.links.map((link, i) => (
            <MarketingSectionNavLink
              key={`${link.label}-${i}`}
              href={link.href}
              label={link.label}
              className="el-nav__link"
            />
          ))}
        </nav>
        <div className="el-nav__actions">
          {logins ? (
            <a href={logins.studentLoginHref} className="el-nav__link">
              Student Login
            </a>
          ) : null}
          {showSecondaryCta ? (
            <EduLearnCta label={secondaryLabel} href={secondaryHref} className="el-nav__cta--header" />
          ) : null}
          <EduLearnCta label={config.nav.ctaLabel} href={config.nav.ctaHref} variant="outline" />
        </div>
      </div>
      {drawer}
    </header>
  );
}
