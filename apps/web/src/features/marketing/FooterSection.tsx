import { Link } from "react-router-dom";
import type { HomepageConfig } from "@/types/homepage";
import { AppleIcon } from "./AppleIcon";
import { StaggerLabel } from "./StaggerLabel";

type Props = {
  config: HomepageConfig;
};

function QrPlaceholder() {
  return (
    <div className="novu-site-footer__qr" aria-hidden>
      <svg viewBox="0 0 37 37" role="img" className="novu-site-footer__qr-svg">
        <path fill="#fff" d="M0 0h7v1H0zM9 0h1v1H9zM14 0h1v1H14zM17 0h1v1H17zM21 0h1v1H21zM26 0h1v1H26zM30 0h7v1H30z" />
        <path fill="#fff" d="M0 1h1v1H0zM6 1h1v1H6zM30 1h7v1H30z" />
        <path fill="#fff" d="M0 6h7v1H0zM30 6h7v1H30z" />
        <path fill="#fff" d="M0 12h7v1H0zM9 12h1v1H9zM14 12h1v1H14zM17 12h1v1H17zM21 12h1v1H21zM26 12h1v1H26zM30 12h7v1H30z" />
        <path fill="#fff" d="M0 18h1v1H0zM6 18h1v1H6zM30 18h7v1H30z" />
        <path fill="#fff" d="M0 24h7v1H0zM30 24h7v1H30z" />
        <path fill="#fff" d="M0 30h7v1H0zM9 30h1v1H9zM14 30h1v1H14zM17 30h1v1H17zM21 30h1v1H21zM26 30h1v1H26zM30 30h7v1H30z" />
        <path fill="#fff" d="M0 36h7v1H0zM30 36h7v1H30z" />
      </svg>
    </div>
  );
}

export function FooterSection({ config }: Props) {
  const cta = config.footerCta;
  const titleParts = cta.title.match(/^(.+?)(\s*)(\S+\.?)$/);
  const titleMain = titleParts?.[1] ?? cta.title;
  const titleSerif = titleParts?.[3] ?? "";

  return (
    <section data-nav-theme="dark" className="novu-footer-section">
      <div className="novu-footer-section__bg">
        <img src={cta.backgroundImageUrl ?? config.hero.backgroundImageUrl} alt="" />
      </div>
      <div className="novu-footer-section__overlay" />

      <div className="novu-footer-section__cta novu-reveal">
        <h2>
          {titleMain} <span className="serif">{titleSerif}</span>
        </h2>
        <p>{cta.subtitle}</p>
        <Link to={cta.ctaHref} className="novu-footer-section__cta-btn group">
          <AppleIcon />
          <span className="novu-nav-bar__cta-visually-hidden">{cta.ctaLabel}</span>
          <StaggerLabel text={cta.ctaLabel} />
        </Link>
      </div>

      <footer className="novu-site-footer">
        <div className="novu-site-footer__grid">
          <div>
            <h3>Product</h3>
            <ul>
              {config.footer.productLinks.map((l) => (
                <li key={l.href}>
                  {l.href.startsWith("/") ? <Link to={l.href}>{l.label}</Link> : <a href={l.href}>{l.label}</a>}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Company</h3>
            <ul>
              {config.footer.companyLinks.map((l) =>
                l.href.startsWith("/") ? (
                  <li key={l.href}>
                    <Link to={l.href}>{l.label}</Link>
                  </li>
                ) : (
                  <li key={l.href}>
                    <a href={l.href}>{l.label}</a>
                  </li>
                )
              )}
            </ul>
          </div>
          <div>
            <h3>Connect</h3>
            <ul>
              {config.footer.connectLinks.map((l) => (
                <li key={l.href}>
                  <a href={l.href} target="_blank" rel="noreferrer">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <QrPlaceholder />
        </div>
        <div className="novu-site-footer__bottom">
          <span>{config.footer.copyright}</span>
          <div className="novu-site-footer__legal">
            <a href={config.footer.privacyHref}>Privacy Policy</a>
            <a href={config.footer.termsHref}>Terms of Use</a>
          </div>
        </div>
      </footer>
    </section>
  );
}
