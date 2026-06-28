import { Link } from "react-router-dom";
import type { HomepageConfig } from "@/types/homepage";
import { sanitizePublicFooterLinks } from "@/lib/marketingPublicSite";

type Props = {
  config: HomepageConfig;
};

function FooterLink({ href, label }: { href: string; label: string }) {
  if (href.startsWith("/") && !href.startsWith("//")) {
    return <Link to={href}>{label}</Link>;
  }

  return (
    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
      {label}
    </a>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h3>{title}</h3>
      <ul>
        {links.map((l) => (
          <li key={`${title}-${l.label}-${l.href}`}>
            <FooterLink href={l.href} label={l.label} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EnterpriseSiteFooter({ config }: Props) {
  const productLinks = sanitizePublicFooterLinks(config.footer.productLinks);
  const companyLinks = sanitizePublicFooterLinks(config.footer.companyLinks);
  const connectLinks = sanitizePublicFooterLinks(config.footer.connectLinks);

  return (
    <footer className="ent-footer">
      <div className="ent-footer__grid">
        <FooterColumn title="Product" links={productLinks} />
        <FooterColumn title="Company" links={companyLinks} />
        <FooterColumn title="Connect" links={connectLinks} />
        <div>
          <h3>Legal</h3>
          <ul>
            <li>
              <FooterLink href={config.footer.privacyHref} label="Privacy" />
            </li>
            <li>
              <FooterLink href={config.footer.termsHref} label="Terms" />
            </li>
          </ul>
        </div>
      </div>
      <div className="ent-footer__bottom">
        <span>{config.footer.copyright}</span>
      </div>
    </footer>
  );
}
