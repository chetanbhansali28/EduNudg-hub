import { Link, useLocation } from "react-router-dom";
import type { HomepageConfig } from "@/types/homepage";
import type { BrandLegalPages } from "@/lib/brandLegalPages";
import { buildFooterLegalLinks } from "@/lib/marketingFooterHelpers";
import { resolveMarketingSectionHref } from "@/lib/marketingPublicSite";

type Props = {
  config: HomepageConfig;
  legalPages?: BrandLegalPages;
  className?: string;
  linkClassName?: string;
  asList?: boolean;
  heading?: string;
};

function FooterLegalAnchor({
  href,
  label,
  linkClassName,
}: {
  href: string;
  label: string;
  linkClassName?: string;
}) {
  const { pathname } = useLocation();
  const resolved = resolveMarketingSectionHref(href, pathname);
  const className = linkClassName ?? "mkt-footer-shell__link";

  if (resolved.startsWith("/") && !resolved.startsWith("//")) {
    return (
      <Link to={resolved} className={className}>
        {label}
      </Link>
    );
  }

  return (
    <a href={resolved} className={className} target="_blank" rel="noreferrer">
      {label}
    </a>
  );
}

export function FooterLegalLinks({
  config,
  legalPages = {},
  className,
  linkClassName,
  asList = false,
  heading,
}: Props) {
  const links = buildFooterLegalLinks(config, legalPages);
  if (links.length === 0) return null;

  if (asList) {
    return (
      <div className={className}>
        {heading ? <h3 className="mkt-footer-shell__heading">{heading}</h3> : null}
        <ul className="mkt-footer-shell__links">
          {links.map((link) => (
            <li key={link.kind}>
              <FooterLegalAnchor href={link.href} label={link.label} linkClassName={linkClassName} />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <nav className={className ?? "mkt-footer-shell__legal"} aria-label="Legal">
      {links.map((link) => (
        <FooterLegalAnchor key={link.kind} href={link.href} label={link.label} linkClassName={linkClassName} />
      ))}
    </nav>
  );
}
