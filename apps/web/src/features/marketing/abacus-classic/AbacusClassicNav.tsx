import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import type { HomepageConfig } from "@/types/homepage";
import { centerPublicLoginHrefs } from "@/features/marketing/CenterPublicNavLogins";
import { MarketingHomeLink } from "@/features/marketing/MarketingPublicOrigin";
import { MarketingSectionNavLink } from "@/features/marketing/MarketingSectionNavLink";
import { AbacusCtaButton } from "./MarketingLeadModals";
import { FranchiseBrandWordmark } from "@/features/marketing/FranchiseBrandWordmark";

type Props = {
  config: HomepageConfig;
  brandSlug?: string;
  brandName?: string | null;
  centerSlug?: string | null;
};

export function AbacusClassicNav({ config, brandSlug, brandName, centerSlug }: Props) {
  const logins = brandSlug ? centerPublicLoginHrefs(brandSlug, centerSlug) : null;
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
    document.body.classList.toggle("ac-nav-drawer-open", menuOpen);
    return () => document.body.classList.remove("ac-nav-drawer-open");
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);
  const secondaryLabel = config.nav.secondaryCtaLabel?.trim() || "";
  const secondaryHref = config.nav.secondaryCtaHref?.trim() || "";
  const showSecondaryCta = Boolean(secondaryLabel && secondaryHref);

  const drawer =
    menuOpen && typeof document !== "undefined"
      ? createPortal(
          <>
            <button
              type="button"
              className="ac-nav__drawer-backdrop"
              aria-label="Close menu"
              onClick={closeMenu}
            />
            <div
              id={menuId}
              className="ac-nav__drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Site menu"
            >
              <div className="ac-nav__drawer-head">
                <FranchiseBrandWordmark
                  className="ac-nav__drawer-title"
                  siteName={config.meta.siteName}
                  brandName={logins ? brandName : null}
                />
                <button type="button" className="ac-nav__drawer-close" aria-label="Close menu" onClick={closeMenu}>
                  ×
                </button>
              </div>
              <div className="ac-nav__drawer-links">
                {config.nav.links.map((link, i) => (
                  <MarketingSectionNavLink
                    key={`${link.label}-${i}`}
                    href={link.href}
                    label={link.label}
                    onClick={closeMenu}
                  />
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
    <header className={`ac-nav${menuOpen ? " ac-nav--menu-open" : ""}${logins ? " ac-nav--franchise" : ""}`}>
      <div className="ac-nav__inner">
        <div className="ac-nav__brand">
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

          <MarketingHomeLink className="ac-nav__logo-link">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="ac-nav__logo-img" width={64} height={64} />
            ) : (
              <span className="ac-nav__logo-fallback">{config.meta.siteName.charAt(0)}</span>
            )}
            <FranchiseBrandWordmark
              className="ac-nav__wordmark"
              siteName={config.meta.siteName}
              brandName={logins ? brandName : null}
            />
          </MarketingHomeLink>
        </div>

        <nav className="ac-nav__links" aria-label="Sections">
          {config.nav.links.map((link, i) => (
            <MarketingSectionNavLink
              key={`${link.label}-${i}`}
              href={link.href}
              label={link.label}
              className="ac-nav__link"
            />
          ))}
        </nav>

        <div className="ac-nav__actions">
          {logins ? (
            <a href={logins.studentLoginHref} className="ac-nav__login-link ac-nav__login-link--student">
              Student Login
            </a>
          ) : null}
          <AbacusCtaButton label={config.nav.ctaLabel} href={config.nav.ctaHref} variant="nav-enroll" />
          {showSecondaryCta ? (
            <AbacusCtaButton label={secondaryLabel} href={secondaryHref} variant="nav-apply" />
          ) : null}
        </div>
      </div>

      {drawer}
    </header>
  );
}
