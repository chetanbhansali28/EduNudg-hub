import { Link } from "react-router-dom";
import type { HomepageConfig } from "@/types/homepage";
import type { BrandLegalPages } from "@/lib/brandLegalPages";
import type { BrandSocialConnect } from "@/lib/brandSocialConnect";
import { buildBrandFooterStats, resolveFooterLegalHref } from "@/lib/marketingFooterHelpers";
import { FooterPresenceBlock } from "@/features/marketing/FooterPresenceBlock";
import { BrandSocialFooterIcons } from "@/features/marketing/BrandSocialFooterIcons";

type Props = {
  config: HomepageConfig;
  legalPages?: BrandLegalPages;
  socialConnect?: BrandSocialConnect;
};

export function AbacusClassicFooter({ config, legalPages = {}, socialConnect = {} }: Props) {
  const rich = config.footer.rich;
  const stats = buildBrandFooterStats(rich);
  const privacyHref = resolveFooterLegalHref("privacy", config, legalPages);
  const termsHref = resolveFooterLegalHref("terms", config, legalPages);

  return (
    <footer className="ac-footer">
      <div className="ac-footer__wave" aria-hidden />
      <div className="ac-footer__inner">
        <div className="ac-footer__grid">
          <div className="ac-footer__brand">
            {config.meta.logoUrl ? (
              <img src={config.meta.logoUrl} alt="" className="ac-footer__logo" width={56} height={56} />
            ) : (
              <span className="ac-footer__logo-fallback">{config.meta.siteName.charAt(0)}</span>
            )}
            {rich?.description ? <p>{rich.description}</p> : null}
            {rich?.badges && rich.badges.length > 0 ? (
              <div className="ac-footer__badges">
                {rich.badges.map((badge, i) => (
                  <span key={`${badge.label}-${i}`} className="ac-footer__badge">
                    {badge.label}
                  </span>
                ))}
              </div>
            ) : null}
            {stats.length > 0 ? (
              <div className="ac-footer__stats">
                {stats.map((stat, i) => (
                  <div key={`${stat.label}-${i}`} className="ac-footer__stat">
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </div>
            ) : null}
            <BrandSocialFooterIcons socialConnect={socialConnect} variant="abacus-classic" />
          </div>

          <div>
            <h3>Quick links</h3>
            <ul>
              {config.footer.productLinks.map((link) => (
                <li key={link.href}>
                  {link.href.startsWith("/") ? <Link to={link.href}>{link.label}</Link> : <a href={link.href}>{link.label}</a>}
                </li>
              ))}
            </ul>
          </div>

          <FooterPresenceBlock
            presence={rich?.presence ?? []}
            regionClassName="ac-footer__presence"
          />

          {rich?.headOffice ? (
            <div>
              <h3>Head office</h3>
              <address className="ac-footer__office">
                <p>{rich.headOffice.address}</p>
                <p>{rich.headOffice.phone}</p>
                <p>{rich.headOffice.website}</p>
              </address>
            </div>
          ) : null}
        </div>

        <div className="ac-footer__bottom">
          <span>{config.footer.copyright}</span>
          <div className="ac-footer__legal">
            {privacyHref ? <Link to={privacyHref}>Privacy Policy</Link> : null}
            {termsHref ? <Link to={termsHref}>Terms of Use</Link> : null}
          </div>
        </div>
      </div>
    </footer>
  );
}
