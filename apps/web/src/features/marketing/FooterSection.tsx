import type { HomepageConfig } from "@/types/homepage";
import type { BrandLegalPages } from "@/lib/brandLegalPages";
import type { BrandSocialConnect } from "@/lib/brandSocialConnect";
import { buildBrandFooterStats } from "@/lib/marketingFooterHelpers";
import { MarketingCtaLink } from "./MarketingCtaLink";
import { MarketingBackgroundMedia } from "./MarketingBackgroundMedia";
import { FooterPresenceBlock } from "./FooterPresenceBlock";
import { BrandSocialFooterIcons } from "./BrandSocialFooterIcons";
import { FooterLinkColumn } from "@/features/marketing/footer/FooterLinkColumn";
import { FooterLegalLinks } from "@/features/marketing/footer/FooterLegalLinks";
import { isSectionEnabled } from "@/lib/homepageSections";

type Props = {
  config: HomepageConfig;
  legalPages?: BrandLegalPages;
  socialConnect?: BrandSocialConnect;
};

export function FooterSection({ config, legalPages = {}, socialConnect = {} }: Props) {
  if (!isSectionEnabled(config, "footer")) {
    return null;
  }

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

      <footer className="novu-site-footer mkt-footer-shell">
        <div className="novu-site-footer__grid">
          <FooterLinkColumn title="Product" links={config.footer.productLinks} />
          <FooterLinkColumn title="Company" links={config.footer.companyLinks} />
          <FooterLinkColumn title="Connect" links={config.footer.connectLinks} />
          <FooterPresenceBlock presence={config.footer.rich?.presence ?? []} />
        </div>
        {footerStats.length > 0 ? (
          <div className="novu-site-footer__stats mkt-footer-shell__stats">
            {footerStats.map((stat) => (
              <div key={`${stat.label}-${stat.value}`} className="novu-site-footer__stat">
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        ) : null}
        <div className="novu-site-footer__bottom">
          <div className="novu-site-footer__bottom-start">
            <span>{config.footer.copyright}</span>
            <BrandSocialFooterIcons socialConnect={socialConnect} variant="novu" />
          </div>
          <FooterLegalLinks config={config} legalPages={legalPages} className="novu-site-footer__legal" />
        </div>
      </footer>
    </section>
  );
}
