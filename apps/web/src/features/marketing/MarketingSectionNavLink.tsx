import { Link, useLocation } from "react-router-dom";
import { resolveMarketingSectionHref } from "@/lib/marketingPublicSite";
import { marketingHrefWithPublicOrigin, useMarketingPublicOrigin } from "./MarketingPublicOrigin";

type Props = {
  href: string;
  label: string;
  className?: string;
  onClick?: () => void;
};

/**
 * Marketing section links: hash targets (`#gallery`) stay on `/` when already home,
 * and become `/#gallery` from `/about` (or other routes) so sections are reachable.
 */
export function MarketingSectionNavLink({ href, label, className, onClick }: Props) {
  const { pathname } = useLocation();
  const publicOrigin = useMarketingPublicOrigin();
  const resolved = marketingHrefWithPublicOrigin(resolveMarketingSectionHref(href, pathname), publicOrigin);

  if (resolved.startsWith("/") && !resolved.startsWith("//") && !/^https?:/i.test(resolved)) {
    return (
      <Link to={resolved} className={className} onClick={onClick}>
        {label}
      </Link>
    );
  }

  return (
    <a href={resolved} className={className} onClick={onClick}>
      {label}
    </a>
  );
}
