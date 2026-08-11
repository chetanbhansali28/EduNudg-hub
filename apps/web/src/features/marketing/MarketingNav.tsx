import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import type { HomepageConfig } from "@/types/homepage";
import { CenterPublicNavLogins } from "./CenterPublicNavLogins";
import { MarketingCtaLink } from "./MarketingCtaLink";
import { MarketingSectionNavLink } from "./MarketingSectionNavLink";
import { useHeroIntroComplete } from "./useHeroIntroComplete";
import { useNavTheme } from "./useNavTheme";

type Props = {
  config: HomepageConfig;
  /** When set (center public site), show Student Login in the main nav. */
  brandSlug?: string;
};

function MenuIcon({ open }: { open: boolean }) {
  return (
    <span className={`novu-nav-bar__menu-icon ${open ? "novu-nav-bar__menu-icon--open" : ""}`} aria-hidden>
      <span />
      <span />
      <span />
    </span>
  );
}

export function MarketingNav({ config, brandSlug }: Props) {
  const theme = useNavTheme();
  const heroIntroComplete = useHeroIntroComplete();
  const isLightBg = theme === "light";
  const navCtaVariant = isLightBg ? "on-light" : "on-dark";
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
    document.body.classList.toggle("novu-nav-drawer-open", menuOpen);
    return () => document.body.classList.remove("novu-nav-drawer-open");
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const drawer =
    menuOpen && typeof document !== "undefined"
      ? createPortal(
          <>
            <button
              type="button"
              className={`novu-nav-bar__drawer-backdrop novu-nav-bar--${theme}`}
              aria-label="Close menu"
              onClick={closeMenu}
            />
            <div
              id={menuId}
              className={`novu-nav-bar__drawer novu-nav-bar--${theme}`}
              role="dialog"
              aria-modal="true"
              aria-label="Site menu"
            >
              <div className="novu-nav-bar__drawer-head">
                <span className="novu-nav-bar__drawer-title">{config.meta.siteName}</span>
                <button
                  type="button"
                  className="novu-nav-bar__drawer-close"
                  aria-label="Close menu"
                  onClick={closeMenu}
                >
                  ×
                </button>
              </div>
              <div className="novu-nav-bar__drawer-links">
                {config.nav.links.map((l, i) => (
                  <MarketingSectionNavLink
                    key={`${l.label}-${l.href}-${i}`}
                    href={l.href}
                    label={l.label}
                    className="novu-nav-bar__drawer-link"
                    onClick={closeMenu}
                  />
                ))}
                {brandSlug ? (
                  <CenterPublicNavLogins brandSlug={brandSlug} inDropdown onNavigate={closeMenu} />
                ) : null}
              </div>
            </div>
          </>,
          document.body
        )
      : null;

  return (
    <nav
      className={`novu-nav-bar novu-nav-bar--${theme} ${heroIntroComplete ? "novu-nav-bar--visible" : ""} ${menuOpen ? "novu-nav-bar--menu-open" : ""}`}
      aria-label="Site"
    >
      <div className="novu-nav-bar__inner">
        <div className="novu-nav-bar__brand">
          <button
            type="button"
            className="novu-nav-bar__menu-toggle"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <MenuIcon open={menuOpen} />
          </button>

          <Link to="/" className="novu-nav-bar__logo" aria-label={`${config.meta.siteName} home`}>
            {logoUrl ? (
              <img src={logoUrl} alt="" className="novu-nav-bar__logo-img" width={40} height={40} />
            ) : (
              <span className="novu-nav-bar__logo-mark" aria-hidden>
                {config.meta.siteName.charAt(0)}
              </span>
            )}
            <span className="novu-nav-bar__wordmark">{config.meta.siteName}</span>
          </Link>
        </div>

        <div className={`novu-nav-bar__pill ${isLightBg ? "novu-nav-bar__pill--on-white" : ""}`}>
          {config.nav.links.map((l, i) => (
            <MarketingSectionNavLink
              key={`${l.label}-${l.href}-${i}`}
              href={l.href}
              label={l.label}
              className="novu-nav-bar__link"
            />
          ))}
          {brandSlug ? <CenterPublicNavLogins brandSlug={brandSlug} isLightBg={isLightBg} /> : null}
          <MarketingCtaLink
            href={config.nav.ctaHref}
            label={config.nav.ctaLabel}
            variant={navCtaVariant}
            className="novu-nav-bar__cta"
            srOnlyLabel
          />
        </div>

        <MarketingCtaLink
          href={config.nav.ctaHref}
          label={config.nav.ctaLabel}
          variant={navCtaVariant}
          className="novu-nav-bar__cta-mobile"
        />
      </div>

      {drawer}
    </nav>
  );
}
