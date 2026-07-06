import { useState } from "react";
import { Link } from "react-router-dom";
import type { HomepageConfig } from "@/types/homepage";
import type { BrandLegalPages } from "@/lib/brandLegalPages";
import type { BrandSocialConnect } from "@/lib/brandSocialConnect";
import { hasBrandSocialFooterIcons } from "@/lib/brandSocialConnect";
import { resolveFooterLegalHref } from "@/lib/marketingFooterHelpers";
import { FooterPresenceBlock } from "@/features/marketing/FooterPresenceBlock";
import { BrandSocialFooterIcons } from "@/features/marketing/BrandSocialFooterIcons";
import { useLeadModalOptional } from "@/features/marketing/abacus-classic/LeadModalContext";
import { resolveLeadModalKind } from "@/features/marketing/abacus-classic/MarketingLeadModals";

type Props = {
  config: HomepageConfig;
  legalPages?: BrandLegalPages;
  socialConnect?: BrandSocialConnect;
};

const DEFAULT_PHONE = "(222) 545-4543";

function PaymentBadges() {
  const brands = ["Klarna", "Visa", "PayPal", "Amex", "Discover", "Mastercard"];

  return (
    <div className="sa-site-footer__payments" aria-label="Accepted payment methods">
      {brands.map((brand) => (
        <span key={brand} className="sa-site-footer__payment-badge">
          {brand}
        </span>
      ))}
    </div>
  );
}

export function SparkAcademyFooter({ config, legalPages = {}, socialConnect = {} }: Props) {
  const modal = useLeadModalOptional();
  const [email, setEmail] = useState("");

  const rich = config.footer.rich;
  const privacyHref = resolveFooterLegalHref("privacy", config, legalPages);
  const termsHref = resolveFooterLegalHref("terms", config, legalPages);
  const phone = rich?.headOffice?.phone?.trim() || DEFAULT_PHONE;
  const phoneHref = `tel:${phone.replace(/[^\d+]/g, "")}`;
  const showSocial = hasBrandSocialFooterIcons(socialConnect);

  const cta = config.footerCta;
  const ctaTitle = cta.title?.trim() || "Start Your Learning Journey Today!";
  const ctaSubtitle =
    cta.subtitle?.trim() || "Browse courses and unlock new skills to reach your goals.";
  const loginLabel = cta.ctaLabel?.trim() || "Login";

  const navLinks =
    config.footer.productLinks.length > 0
      ? config.footer.productLinks.slice(0, 3)
      : [
          { label: "Courses", href: "#programs" },
          { label: "Shop", href: "#programs" },
          { label: "Contact Us", href: "#apply" },
        ];

  const handleEmailSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const modalKind = resolveLeadModalKind(cta.ctaHref);
    if (modalKind && modal) {
      modal.openModal(modalKind);
      return;
    }
    window.location.href = config.nav.adminHref;
  };

  const arrowCtaKind = resolveLeadModalKind(cta.ctaHref);
  const copyrightText = config.footer.copyright.startsWith("Copyright")
    ? config.footer.copyright
    : config.footer.copyright.replace(/^©\s*/, "Copyright © ");

  return (
    <footer className="sa-site-footer">
      <div className="sa-site-footer__cta-band">
        <div className="sa-site-footer__inner">
          <div className="sa-site-footer__cta-grid">
            <div className="sa-site-footer__contact">
              <span className="sa-site-footer__label">Contact Us</span>
              <a href={phoneHref} className="sa-site-footer__phone">
                {phone}
              </a>
            </div>

            <div className="sa-site-footer__cta-center">
              <h2>{ctaTitle}</h2>
              <p>{ctaSubtitle}</p>
              <form className="sa-site-footer__email-form" onSubmit={handleEmailSubmit}>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email Address"
                  aria-label="Email address"
                />
                <Link to={config.nav.adminHref} className="sa-site-footer__login-btn">
                  {loginLabel}
                </Link>
                {arrowCtaKind && modal ? (
                  <button
                    type="button"
                    className="sa-site-footer__arrow-btn"
                    aria-label={cta.ctaLabel || "Get started"}
                    onClick={() => modal.openModal(arrowCtaKind)}
                  >
                    <span aria-hidden>↗</span>
                  </button>
                ) : (
                  <a href={cta.ctaHref} className="sa-site-footer__arrow-btn" aria-label={cta.ctaLabel || "Get started"}>
                    <span aria-hidden>↗</span>
                  </a>
                )}
              </form>
            </div>

            {showSocial ? (
              <div className="sa-site-footer__social">
                <span className="sa-site-footer__label">Social Media</span>
                <BrandSocialFooterIcons socialConnect={socialConnect} variant="spark-academy" />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="sa-site-footer__nav-band">
        <div className="sa-site-footer__inner sa-site-footer__nav-row">
          <div className="sa-site-footer__brand">
            {config.meta.logoUrl ? (
              <img src={config.meta.logoUrl} alt="" className="sa-site-footer__logo" width={40} height={40} />
            ) : (
              <span className="sa-site-footer__logo-fallback">{config.meta.siteName.charAt(0)}</span>
            )}
            <strong>{config.meta.siteName}</strong>
          </div>

          <nav className="sa-site-footer__nav" aria-label="Footer">
            {navLinks.map((link) => (
              <a key={`${link.label}-${link.href}`} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>

          <FooterPresenceBlock
            presence={rich?.presence ?? []}
            className="sa-site-footer__presence"
            regionClassName="sa-site-footer__presence-region"
          />

          <div className="sa-site-footer__legal">
            {termsHref ? <Link to={termsHref}>Terms &amp; Conditions</Link> : null}
            {privacyHref ? <Link to={privacyHref}>Privacy Policy</Link> : null}
          </div>
        </div>
      </div>

      <div className="sa-site-footer__bottom-band">
        <div className="sa-site-footer__inner sa-site-footer__bottom-row">
          <p>{copyrightText}</p>
          <PaymentBadges />
        </div>
      </div>
    </footer>
  );
}
