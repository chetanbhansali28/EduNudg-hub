import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { HomepageConfig } from "@/types/homepage";

type Props = {
  config: HomepageConfig;
};

export function EnterpriseNav({ config }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const menuWrapRef = useRef<HTMLDivElement>(null);
  const logoUrl = config.meta.logoUrl?.trim() || null;

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
    if (!menuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!menuWrapRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen]);

  return (
    <nav
      className={`ent-nav ${scrolled ? "ent-nav--scrolled" : ""}`}
      aria-label="Site"
    >
      <div className="ent-nav__inner">
        <div className="ent-nav__start" ref={menuWrapRef}>
          <button
            type="button"
            className="ent-nav__menu-toggle"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="ent-nav__menu-icon" aria-hidden>
              <span />
              <span />
              <span />
            </span>
          </button>

          {menuOpen ? (
            <div id={menuId} className="ent-nav__dropdown" role="menu">
              {config.nav.links.map((l, i) => (
                <a
                  key={`${l.label}-${l.href}-${i}`}
                  href={l.href}
                  className="ent-nav__dropdown-link"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  {l.label}
                </a>
              ))}
            </div>
          ) : null}

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
            <a key={`${l.label}-${l.href}-${i}`} href={l.href} className="ent-nav__link">
              {l.label}
            </a>
          ))}
        </div>

        <div className="ent-nav__actions">
          <Link to="/login" className="ent-nav__sign-in">
            Sign In
          </Link>
          <a href={config.nav.ctaHref} className="ent-nav__cta">
            {config.nav.ctaLabel}
          </a>
        </div>
      </div>
    </nav>
  );
}
