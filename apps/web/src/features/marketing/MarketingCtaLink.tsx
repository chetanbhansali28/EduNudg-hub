import { Link } from "react-router-dom";
import { StaggerLabel } from "./StaggerLabel";

export type MarketingCtaVariant = "on-dark" | "on-light";

type Props = {
  href: string;
  label: string;
  variant?: MarketingCtaVariant;
  className?: string;
  /** Screen-reader-only duplicate label (nav desktop CTA). */
  srOnlyLabel?: boolean;
  onClick?: () => void;
};

/** Shared primary CTA for marketing nav, hero, and footer. */
export function MarketingCtaLink({
  href,
  label,
  variant = "on-dark",
  className,
  srOnlyLabel = false,
  onClick,
}: Props) {
  const classes = [
    "novu-marketing-cta",
    `novu-marketing-cta--${variant}`,
    "group",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const body = (
    <>
      {srOnlyLabel ? <span className="novu-marketing-cta__sr-only">{label}</span> : null}
      <StaggerLabel text={label} />
    </>
  );

  const a11y = { "aria-label": label };

  if (href.startsWith("#")) {
    return (
      <a href={href} className={classes} {...a11y} onClick={onClick}>
        {body}
      </a>
    );
  }

  return (
    <Link to={href} className={classes} {...a11y} onClick={onClick}>
      {body}
    </Link>
  );
}
