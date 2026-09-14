import { createContext, useContext, type ReactNode } from "react";
import { Link } from "react-router-dom";

const MarketingPublicOriginContext = createContext<string | null>(null);

export function MarketingPublicOriginProvider({
  origin,
  children,
}: {
  origin: string | null;
  children: ReactNode;
}) {
  return <MarketingPublicOriginContext.Provider value={origin}>{children}</MarketingPublicOriginContext.Provider>;
}

export function useMarketingPublicOrigin(): string | null {
  return useContext(MarketingPublicOriginContext);
}

export function marketingHrefWithPublicOrigin(href: string, origin: string | null): string {
  const trimmed = href.trim();
  if (!origin) return trimmed;
  const base = origin.replace(/\/$/, "");
  if (trimmed.startsWith("#") && trimmed !== "#") return `${base}/${trimmed}`;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return `${base}${trimmed}`;
  return trimmed;
}

export function MarketingHomeLink({
  className,
  children,
  onClick,
  "aria-label": ariaLabel,
}: {
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  "aria-label"?: string;
}) {
  const origin = useMarketingPublicOrigin();
  const href = origin ? `${origin.replace(/\/$/, "")}/` : "/";
  if (origin) {
    return (
      <a href={href} className={className} aria-label={ariaLabel} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <Link to="/" className={className} aria-label={ariaLabel} onClick={onClick}>
      {children}
    </Link>
  );
}
