import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { HomepageConfig } from "@/types/homepage";
import { MarketingCtaLink } from "./MarketingCtaLink";
import { useHeroIntroComplete } from "./useHeroIntroComplete";
import { useNavTheme } from "./useNavTheme";

type Props = {
  config: HomepageConfig;
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

export function MarketingNav({ config }: Props) {
  const theme = useNavTheme();
  const heroIntroComplete = useHeroIntroComplete();
  const isLight = theme === "light";
  const navCtaVariant = isLight ? "on-dark" : "on-light";
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

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!menuWrapRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav
      className={`novu-nav-bar novu-nav-bar--${theme} ${heroIntroComplete ? "novu-nav-bar--visible" : ""} ${menuOpen ? "novu-nav-bar--menu-open" : ""}`}
      aria-label="Site"
    >
      <div className="novu-nav-bar__inner">
        <div className="novu-nav-bar__brand" ref={menuWrapRef}>
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

          {menuOpen ? (
            <div id={menuId} className="novu-nav-bar__dropdown" role="menu">
              {config.nav.links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="novu-nav-bar__dropdown-link"
                  role="menuitem"
                  onClick={closeMenu}
                >
                  {l.label}
                </a>
              ))}
            </div>
          ) : null}

          <Link to="/" className="novu-nav-bar__logo" aria-label={`${config.meta.siteName} home`}>
            {logoUrl ? (
              <img src={logoUrl} alt="" className="novu-nav-bar__logo-img" width={40} height={40} />
            ) : (
              <span className="novu-nav-bar__logo-mark" aria-hidden>
                {config.meta.siteName.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="novu-nav-bar__wordmark">{config.meta.siteName.toLowerCase()}</span>
          </Link>
        </div>

        <div className={`novu-nav-bar__pill ${isLight ? "novu-nav-bar__pill--light" : ""}`}>
          {config.nav.links.map((l) => (
            <a key={l.href} href={l.href} className="novu-nav-bar__link">
              {l.label}
            </a>
          ))}
          <MarketingCtaLink
            href={config.nav.ctaHref}
            label={config.nav.ctaLabel}
            variant={navCtaVariant}
            className="novu-nav-bar__cta"
            srOnlyLabel
            showIcon={false}
          />
        </div>

        <MarketingCtaLink
          href={config.nav.ctaHref}
          label={config.nav.ctaLabel}
          variant={navCtaVariant}
          className="novu-nav-bar__cta-mobile"
          showIcon={false}
        />
      </div>
    </nav>
  );
}
