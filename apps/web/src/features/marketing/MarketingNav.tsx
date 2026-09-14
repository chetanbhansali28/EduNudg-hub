import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import type { HomepageConfig } from "@/types/homepage";
import { CenterPublicNavLogins } from "./CenterPublicNavLogins";
import { MarketingCtaLink } from "./MarketingCtaLink";
import { MarketingHomeLink } from "./MarketingPublicOrigin";
import { MarketingSectionNavLink } from "./MarketingSectionNavLink";
import { useHeroIntroComplete } from "./useHeroIntroComplete";
import { useNavTheme } from "./useNavTheme";
import { FranchiseBrandWordmark } from "./FranchiseBrandWordmark";
import { franchiseBrandLockup } from "@/lib/portalBranding";

type Props = {
  config: HomepageConfig;
  /** When set (center public site), show Student Login in the main nav. */
  brandSlug?: string;
  brandName?: string | null;
  centerSlug?: string | null;
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

export function MarketingNav({ config, brandSlug, brandName, centerSlug }: Props) {
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
  const lockup = franchiseBrandLockup(config.meta.siteName, brandSlug ? brandName : null);

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
                <FranchiseBrandWordmark
                  className="novu-nav-bar__drawer-title"
                  siteName={config.meta.siteName}
                  brandName={brandSlug ? brandName : null}
                />
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
                  <CenterPublicNavLogins
                    brandSlug={brandSlug}
                    centerSlug={centerSlug}
                    inDropdown
                    onNavigate={closeMenu}
                  />
                ) : null}
              </div>
            </div>
          </>,
          document.body
        )
      : null;

  return (
    <nav
      className={`novu-nav-bar novu-nav-bar--${theme} ${heroIntroComplete ? "novu-nav-bar--visible" : ""} ${menuOpen ? "novu-nav-bar--menu-open" : ""}${brandSlug ? " novu-nav-bar--franchise" : ""}`}
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

          <MarketingHomeLink className="novu-nav-bar__logo" aria-label={`${lockup.accessibleName} home`}>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt=""
                className="novu-nav-bar__logo-img"
                width={64}
                height={64}
              />
            ) : (
              <span className="novu-nav-bar__logo-mark" aria-hidden>
                {config.meta.siteName.charAt(0)}
              </span>
            )}
            <FranchiseBrandWordmark
              className="novu-nav-bar__wordmark"
              siteName={config.meta.siteName}
              brandName={brandSlug ? brandName : null}
            />
          </MarketingHomeLink>
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
          {brandSlug ? (
            <CenterPublicNavLogins brandSlug={brandSlug} centerSlug={centerSlug} isLightBg={isLightBg} />
          ) : null}
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
