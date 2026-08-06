import { Link, useLocation } from "react-router-dom";
import type { HomepageConfig } from "@/types/homepage";
import { sanitizePublicFooterLinks } from "@/lib/marketingPublicSite";
import type { BrandLegalPages } from "@/lib/brandLegalPages";
import { FooterLinkColumn } from "@/features/marketing/footer/FooterLinkColumn";
import { FooterLegalLinks } from "@/features/marketing/footer/FooterLegalLinks";

type Props = {
  config: HomepageConfig;
  legalPages?: BrandLegalPages;
};

export function EnterpriseSiteFooter({ config, legalPages = {} }: Props) {
  const productLinks = sanitizePublicFooterLinks(config.footer.productLinks);
  const companyLinks = sanitizePublicFooterLinks(config.footer.companyLinks);
  const connectLinks = sanitizePublicFooterLinks(config.footer.connectLinks);

  return (
    <footer className="ent-footer mkt-footer-shell">
      <div className="ent-footer__grid">
        <FooterLinkColumn title="Product" links={productLinks} />
        <FooterLinkColumn title="Company" links={companyLinks} />
        <FooterLinkColumn title="Connect" links={connectLinks} />
        <FooterLegalLinks
          config={config}
          legalPages={legalPages}
          asList
          heading="Legal"
        />
      </div>
      <div className="ent-footer__bottom">
        <span>{config.footer.copyright}</span>
      </div>
    </footer>
  );
}
