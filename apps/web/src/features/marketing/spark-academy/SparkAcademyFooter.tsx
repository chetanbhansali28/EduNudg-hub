import { useState } from "react";
import { Link } from "react-router-dom";
import type { HomepageConfig, HomepageFooterSocial } from "@/types/homepage";
import type { BrandLegalPages } from "@/lib/brandLegalPages";
import { resolveFooterLegalHref } from "@/lib/marketingFooterHelpers";
import { FooterPresenceBlock } from "@/features/marketing/FooterPresenceBlock";
import { useLeadModalOptional } from "@/features/marketing/abacus-classic/LeadModalContext";
import { resolveLeadModalKind } from "@/features/marketing/abacus-classic/MarketingLeadModals";

type Props = {
  config: HomepageConfig;
  legalPages?: BrandLegalPages;
};

const DEFAULT_SOCIAL_LINKS: HomepageFooterSocial[] = [
  { platform: "Facebook", url: "https://facebook.com" },
  { platform: "Instagram", url: "https://instagram.com" },
  { platform: "X", url: "https://x.com" },
  { platform: "YouTube", url: "https://youtube.com" },
];

const DEFAULT_PHONE = "(222) 545-4543";

function SocialIcon({ platform }: { platform: string }) {
  const key = platform.toLowerCase();

  if (key.includes("facebook")) {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
        <path
          fill="currentColor"
          d="M14 8.5V7.2c0-.7.5-1.2 1.2-1.2H16V3h-1.4C12.8 3 12 4.5 12 6.2V8.5H10v2.8h2V21h2.8v-9.7H17l.4-2.8H14z"
        />
      </svg>
    );
  }

  if (key.includes("instagram")) {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
        <path
          fill="currentColor"
          d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 4.8A4.2 4.2 0 1 0 16.2 12 4.2 4.2 0 0 0 12 7.8zm5.9-2.3a1 1 0 1 0-1 1 1 1 0 0 0 1-1z"
        />
      </svg>
    );
  }

  if (key === "x" || key.includes("twitter")) {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
        <path
          fill="currentColor"
          d="M17.3 4H20l-6.4 7.3L21 20h-5.5l-4.3-5.6L6 20H3.3l6.8-7.8L3 4h5.6l3.9 5.1L17.3 4zm-1.9 14.2h1.5L7.8 5.7H6.2l9.2 12.5z"
        />
      </svg>
    );
  }

  if (key.includes("youtube")) {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
        <path
          fill="currentColor"
          d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18 5 12 5 12 5s-6 0-7.8.4a2.5 2.5 0 0 0-1.8 1.8C2 9 2 12 2 12s0 3 .4 4.8a2.5 2.5 0 0 0 1.8 1.8C6 19 12 19 12 19s6 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.8.4-4.8.4-4.8s0-3-.4-4.8zM10 15.5V8.5l5.5 3.5L10 15.5z"
        />
      </svg>
    );
  }

  return null;
}

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

export function SparkAcademyFooter({ config, legalPages = {} }: Props) {
  const modal = useLeadModalOptional();
  const [email, setEmail] = useState("");

  const rich = config.footer.rich;
  const privacyHref = resolveFooterLegalHref("privacy", config, legalPages);
  const termsHref = resolveFooterLegalHref("terms", config, legalPages);
  const phone = rich?.headOffice?.phone?.trim() || DEFAULT_PHONE;
  const phoneHref = `tel:${phone.replace(/[^\d+]/g, "")}`;
  const socialLinks =
    rich?.socialLinks && rich.socialLinks.length > 0 ? rich.socialLinks : DEFAULT_SOCIAL_LINKS;

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

            <div className="sa-site-footer__social">
              <span className="sa-site-footer__label">Social Media</span>
              <div className="sa-site-footer__social-icons">
                {socialLinks.map((link, index) => (
                  <a
                    key={`${link.platform}-${index}`}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={link.platform}
                  >
                    <SocialIcon platform={link.platform} />
                  </a>
                ))}
              </div>
            </div>
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
