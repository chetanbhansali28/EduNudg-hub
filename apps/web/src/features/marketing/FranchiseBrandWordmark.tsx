import { franchiseBrandLockup } from "@/lib/portalBranding";

type Props = {
  siteName: string;
  brandName?: string | null;
  className?: string;
};

/** Franchise name, then “by {brand}” in a smaller line when the names differ. */
export function FranchiseBrandWordmark({ siteName, brandName, className }: Props) {
  const lockup = franchiseBrandLockup(siteName, brandName);
  return (
    <span className={className} aria-label={lockup.accessibleName}>
      <span className="ed-franchise-wordmark">
        <span className="ed-franchise-wordmark__name">{lockup.primaryName}</span>
        {lockup.byline ? <span className="ed-franchise-wordmark__byline">{lockup.byline}</span> : null}
      </span>
    </span>
  );
}
