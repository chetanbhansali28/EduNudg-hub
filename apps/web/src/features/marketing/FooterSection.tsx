import { Link } from "react-router-dom";
import type { HomepageConfig } from "@/types/homepage";
import type { BrandLegalPages } from "@/lib/brandLegalPages";
import { buildBrandFooterStats, resolveFooterLegalHref } from "@/lib/marketingFooterHelpers";
import { MarketingCtaLink } from "./MarketingCtaLink";
import { MarketingBackgroundMedia } from "./MarketingBackgroundMedia";
import { FooterPresenceBlock } from "./FooterPresenceBlock";
import { isSectionEnabled } from "@/lib/homepageSections";

type Props = {
  config: HomepageConfig;
  legalPages?: BrandLegalPages;
};

export function FooterSection({ config, legalPages = {} }: Props) {
  if (!isSectionEnabled(config, "footer")) {
    return null;
  }

  const privacyHref = resolveFooterLegalHref("privacy", config, legalPages);
  const termsHref = resolveFooterLegalHref("terms", config, legalPages);
  const footerStats = buildBrandFooterStats(config.footer.rich);
  const cta = config.footerCta;
  const titleParts = cta.title.match(/^(.+?)(\s*)(\S+\.?)$/);
  const titleMain = titleParts?.[1] ?? cta.title;
  const titleSerif = titleParts?.[3] ?? "";

  return (
    <section data-nav-theme="dark" className="novu-footer-section">
      <div className="novu-footer-section__bg">
        <MarketingBackgroundMedia src={cta.backgroundImageUrl ?? config.hero.backgroundImageUrl} />
      </div>
      <div className="novu-footer-section__overlay" />

      <div className="novu-footer-section__cta novu-reveal">
        <h2>
          {titleMain} <span className="serif">{titleSerif}</span>
        </h2>
        <p>{cta.subtitle}</p>
        <MarketingCtaLink
          href={config.nav.ctaHref}
          label={config.nav.ctaLabel}
          variant="on-dark"
          className="novu-footer-section__cta-btn"
        />
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
          <FooterPresenceBlock presence={config.footer.rich?.presence ?? []} />
        </div>
        {footerStats.length > 0 ? (
          <div className="novu-site-footer__stats">
            {footerStats.map((stat) => (
              <div key={`${stat.label}-${stat.value}`} className="novu-site-footer__stat">
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        ) : null}
        <div className="novu-site-footer__bottom">
          <span>{config.footer.copyright}</span>
          <div className="novu-site-footer__legal">
            {privacyHref ? <Link to={privacyHref}>Privacy Policy</Link> : null}
            {termsHref ? <Link to={termsHref}>Terms of Use</Link> : null}
          </div>
        </div>
      </footer>
    </section>
  );
}
