import type { HomepageConfig } from "@/types/homepage";
import type { BrandLegalPages } from "@/lib/brandLegalPages";
import type { BrandSocialConnect } from "@/lib/brandSocialConnect";
import type { CenterFooterContact } from "@/lib/centerFooterContact";
import { hasBrandSocialFooterIcons } from "@/lib/brandSocialConnect";
import { BrandSocialFooterIcons } from "@/features/marketing/BrandSocialFooterIcons";
import { FooterLegalLinks } from "@/features/marketing/footer/FooterLegalLinks";
import { MarketingSectionNavLink } from "@/features/marketing/MarketingSectionNavLink";
import { CenterFooterContactBlock } from "@/features/marketing/footer/CenterFooterContactBlock";
import { EduLearnCta } from "./EduLearnCta";

type Props = {
  config: HomepageConfig;
  legalPages?: BrandLegalPages;
  socialConnect?: BrandSocialConnect;
  centerContact?: CenterFooterContact | null;
};

export function EduLearnFooter({
  config,
  legalPages = {},
  socialConnect = {},
  centerContact,
}: Props) {
  const onCenterHost = centerContact !== undefined;
  const showSocial = hasBrandSocialFooterIcons(socialConnect);
  const logoUrl = config.meta.logoUrl?.trim() || null;
  const links = config.nav.links.length > 0 ? config.nav.links : config.footer.productLinks;
  const loginHref = config.nav.adminHref?.trim() || "/login";

  return (
    <footer className="el-footer mkt-footer-shell">
      <div className="el-footer__inner">
        <div className="el-footer__top">
          <a href="/" className="el-footer__brand">
            {logoUrl ? <img src={logoUrl} alt="" className="el-nav__logo-img" width={38} height={38} /> : null}
            <span className="el-nav__wordmark">{config.meta.siteName}</span>
          </a>
          <nav className="el-footer__links" aria-label="Footer">
            {links.map((link, i) => (
              <MarketingSectionNavLink
                key={`${link.label}-${i}`}
                href={link.href}
                label={link.label}
                className="el-nav__link"
              />
            ))}
          </nav>
          <EduLearnCta label="Log in now" href={loginHref} />
        </div>
        {onCenterHost && centerContact ? (
          <CenterFooterContactBlock contact={centerContact} heading="This center" />
        ) : null}
        <div className="el-footer__bottom">
          <p>{config.footer.copyright}</p>
          <FooterLegalLinks
            config={config}
            legalPages={legalPages}
            className="el-footer__legal"
            linkClassName="el-nav__link"
          />
          {showSocial ? (
            <BrandSocialFooterIcons socialConnect={socialConnect} variant="edu-learn" />
          ) : null}
        </div>
      </div>
    </footer>
  );
}
