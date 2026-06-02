import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { HomepageConfig } from "@/types/homepage";
import { AppleIcon } from "./AppleIcon";
import { StaggerLabel } from "./StaggerLabel";
import type { NavTheme } from "./useNavTheme";

type Props = {
  config: HomepageConfig;
  theme: NavTheme;
};

const SCROLL_SHOW = 72;

export function MarketingNav({ config, theme }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > SCROLL_SHOW);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isLight = theme === "light";

  return (
    <nav
      className={`novu-nav-bar novu-nav-bar--${theme} ${visible ? "novu-nav-bar--visible" : ""}`}
      aria-label="Site"
    >
      <div className="novu-nav-bar__inner">
        <Link to="/" className="novu-nav-bar__logo" aria-label={`${config.meta.siteName} home`}>
          <span className="novu-nav-bar__wordmark">{config.meta.siteName.toLowerCase()}</span>
        </Link>

        <div className={`novu-nav-bar__pill ${isLight ? "novu-nav-bar__pill--light" : ""}`}>
          {config.nav.links.map((l) => (
            <a key={l.href} href={l.href} className="novu-nav-bar__link">
              {l.label}
            </a>
          ))}
          <Link to={config.nav.ctaHref} className="novu-nav-bar__cta group">
            <AppleIcon />
            <span className="novu-nav-bar__cta-visually-hidden">{config.nav.ctaLabel}</span>
            <StaggerLabel text={config.nav.ctaLabel} />
          </Link>
        </div>

        <Link to={config.nav.ctaHref} className="novu-nav-bar__cta-mobile group" aria-label={config.nav.ctaLabel}>
          <AppleIcon />
          <StaggerLabel text={config.nav.ctaLabel} />
        </Link>
      </div>
    </nav>
  );
}
