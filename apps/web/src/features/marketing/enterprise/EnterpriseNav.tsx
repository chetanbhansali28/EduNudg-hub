import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import type { HomepageConfig } from "@/types/homepage";
import { resolveMarketingSectionHref } from "@/lib/marketingPublicSite";

type Props = {
  config: HomepageConfig;
};

function MenuIcon({ open }: { open: boolean }) {
  return (
    <span className={`ent-nav__menu-icon${open ? " ent-nav__menu-icon--open" : ""}`} aria-hidden>
      <span />
      <span />
      <span />
    </span>
  );
}

export function EnterpriseNav({ config }: Props) {
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const logoUrl = config.meta.logoUrl?.trim() || null;
  const ctaLabel =
    config.hero.ctaLabel?.trim() ||
    config.nav.ctaLabel?.trim() ||
    "Launch for FREE";
  const ctaHref =
    config.hero.ctaHref?.trim() || config.nav.ctaHref?.trim() || "#brand-signup";
  const resolvedCtaHref = resolveMarketingSectionHref(ctaHref, pathname);
  // Compact label for the tight mobile top bar; full label remains in the drawer.
  const mobileCtaLabel =
    ctaLabel.length > 18 ? ctaLabel.replace(/^Launch Franchise for FREE$/i, "Launch for FREE") : ctaLabel;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  useEffect(() => {
    document.body.classList.toggle("ent-nav-drawer-open", menuOpen);
    return () => document.body.classList.remove("ent-nav-drawer-open");
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const drawer =
    menuOpen && typeof document !== "undefined"
      ? createPortal(
          <>
            <button
              type="button"
              className="ent-nav__drawer-backdrop"
              aria-label="Close menu"
              onClick={closeMenu}
            />
            <div
              id={menuId}
              className="ent-nav__drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Site menu"
            >
              <div className="ent-nav__drawer-head">
                <span className="ent-nav__drawer-title">{config.meta.siteName}</span>
                <button
                  type="button"
                  className="ent-nav__drawer-close"
                  aria-label="Close menu"
                  onClick={closeMenu}
                >
                  ×
                </button>
              </div>
              <div className="ent-nav__drawer-links">
                {config.nav.links.map((l, i) => {
                  const href = resolveMarketingSectionHref(l.href, pathname);
                  return (
                    <a
                      key={`${l.label}-${l.href}-${i}`}
                      href={href}
                      className="ent-nav__drawer-link"
                      onClick={closeMenu}
                    >
                      {l.label}
                    </a>
                  );
                })}
                <Link to="/login" className="ent-nav__drawer-link" onClick={closeMenu}>
                  Login
                </Link>
                <a href={resolvedCtaHref} className="ent-nav__drawer-cta" onClick={closeMenu}>
                  {ctaLabel}
                </a>
              </div>
            </div>
          </>,
          document.body
        )
      : null;

  return (
    <nav
      className={`ent-nav${scrolled ? " ent-nav--scrolled" : ""}${menuOpen ? " ent-nav--menu-open" : ""}`}
      aria-label="Site"
    >
      <div className="ent-nav__inner">
        <div className="ent-nav__start">
          <button
            type="button"
            className="ent-nav__menu-toggle"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <MenuIcon open={menuOpen} />
          </button>

          <Link to="/" className="ent-nav__logo" aria-label={`${config.meta.siteName} home`}>
            {logoUrl ? (
              <img src={logoUrl} alt="" className="ent-nav__logo-img" width={32} height={32} />
            ) : (
              <span className="ent-nav__logo-mark" aria-hidden>
                {config.meta.siteName.charAt(0)}
              </span>
            )}
            <span className="ent-nav__wordmark">{config.meta.siteName}</span>
          </Link>
        </div>

        <div className="ent-nav__links" aria-label="Primary">
          {config.nav.links.map((l, i) => (
            <a
              key={`${l.label}-${l.href}-${i}`}
              href={resolveMarketingSectionHref(l.href, pathname)}
              className="ent-nav__link"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="ent-nav__actions">
          <Link to="/login" className="ent-nav__sign-in">
            Login
          </Link>
          <a href={resolvedCtaHref} className="ent-nav__cta">
            {ctaLabel}
          </a>
        </div>

        <a href={resolvedCtaHref} className="ent-nav__cta ent-nav__cta--mobile">
          {mobileCtaLabel}
        </a>
      </div>
      {drawer}
    </nav>
  );
}
