import type { HomepageConfig } from "@/types/homepage";
import type { BrandLegalPages } from "@/lib/brandLegalPages";
import type { BrandSocialConnect } from "@/lib/brandSocialConnect";
import type { CenterFooterContact } from "@/lib/centerFooterContact";
import { centerPhoneHref } from "@/lib/centerFooterContact";
import { hasBrandSocialFooterIcons } from "@/lib/brandSocialConnect";
import { FooterPresenceBlock } from "@/features/marketing/FooterPresenceBlock";
import { BrandSocialFooterIcons } from "@/features/marketing/BrandSocialFooterIcons";
import { FooterLegalLinks } from "@/features/marketing/footer/FooterLegalLinks";
import { FooterLinkColumn } from "@/features/marketing/footer/FooterLinkColumn";
import { CenterFooterContactBlock } from "@/features/marketing/footer/CenterFooterContactBlock";

type Props = {
  config: HomepageConfig;
  legalPages?: BrandLegalPages;
  socialConnect?: BrandSocialConnect;
  /** Center host only — `null` hides brand placeholder phone. */
  centerContact?: CenterFooterContact | null;
};

const DEFAULT_PHONE = "(222) 545-4543";

const FALLBACK_NAV_LINKS = [
  { label: "Courses", href: "#programs" },
  { label: "Shop", href: "#programs" },
  { label: "Contact Us", href: "#apply" },
];

export function SparkAcademyFooter({
  config,
  legalPages = {},
  socialConnect = {},
  centerContact,
}: Props) {
  const rich = config.footer.rich;
  const onCenterHost = centerContact !== undefined;
  const phone = onCenterHost
    ? (centerContact?.phone ?? "")
    : rich?.headOffice?.phone?.trim() || DEFAULT_PHONE;
  const phoneHref = phone ? centerPhoneHref(phone) : "";
  const showSocial = hasBrandSocialFooterIcons(socialConnect);
  const presence = onCenterHost ? [] : (rich?.presence ?? []);
  const brandAddress = !onCenterHost ? rich?.headOffice?.address?.trim() : "";
  const brandWebsite = !onCenterHost ? rich?.headOffice?.website?.trim() : "";

  const navLinks = config.footer.productLinks.length > 0 ? config.footer.productLinks : FALLBACK_NAV_LINKS;

  const copyrightText = config.footer.copyright.startsWith("Copyright")
    ? config.footer.copyright
    : config.footer.copyright.replace(/^©\s*/, "Copyright © ");

  return (
    <footer className="sa-site-footer mkt-footer-shell">
      <div className="sa-site-footer__inner">
        <div className="sa-site-footer__grid">
          <div className="sa-site-footer__brand">
            <div className="sa-site-footer__brand-mark">
              {config.meta.logoUrl ? (
                <img src={config.meta.logoUrl} alt="" className="sa-site-footer__logo" width={44} height={44} />
              ) : (
                <span className="sa-site-footer__logo-fallback">{config.meta.siteName.charAt(0)}</span>
              )}
              <strong>{config.meta.siteName}</strong>
            </div>
            {rich?.description ? <p className="sa-site-footer__blurb">{rich.description}</p> : null}
          </div>

          <FooterLinkColumn
            title="Explore"
            links={navLinks}
            headingClassName="mkt-footer-shell__heading"
            linkClassName="sa-site-footer__nav-link"
          />

          {onCenterHost ? (
            centerContact ? (
              <div className="sa-site-footer__contact">
                <CenterFooterContactBlock
                  contact={centerContact}
                  heading="Contact"
                  addressClassName="sa-site-footer__office"
                />
                {showSocial ? (
                  <BrandSocialFooterIcons socialConnect={socialConnect} variant="spark-academy" />
                ) : null}
              </div>
            ) : showSocial ? (
              <div className="sa-site-footer__contact">
                <h3 className="mkt-footer-shell__heading">Follow us</h3>
                <BrandSocialFooterIcons socialConnect={socialConnect} variant="spark-academy" />
              </div>
            ) : null
          ) : (
            <div className="sa-site-footer__contact">
              <h3 className="mkt-footer-shell__heading">Contact</h3>
              <address className="sa-site-footer__office">
                {phone ? (
                  <p>
                    <a href={phoneHref} className="sa-site-footer__phone">
                      {phone}
                    </a>
                  </p>
                ) : null}
                {brandAddress ? <p>{brandAddress}</p> : null}
                {brandWebsite ? <p>{brandWebsite}</p> : null}
              </address>
              {showSocial ? (
                <BrandSocialFooterIcons socialConnect={socialConnect} variant="spark-academy" />
              ) : null}
            </div>
          )}

          <FooterPresenceBlock
            presence={presence}
            className="sa-site-footer__presence"
            regionClassName="sa-site-footer__presence-region"
          />
        </div>

        <div className="sa-site-footer__bottom">
          <p>{copyrightText}</p>
          <FooterLegalLinks
            config={config}
            legalPages={legalPages}
            className="sa-site-footer__legal"
            linkClassName="sa-site-footer__legal-link"
          />
        </div>
      </div>
    </footer>
  );
}
