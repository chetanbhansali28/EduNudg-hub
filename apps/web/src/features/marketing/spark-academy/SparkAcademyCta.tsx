import { useLeadModalOptional } from "@/features/marketing/abacus-classic/LeadModalContext";
import { resolveLeadModalKind } from "@/features/marketing/abacus-classic/MarketingLeadModals";

type Props = {
  label: string;
  href: string;
  variant?: "primary" | "dark" | "outline";
  className?: string;
  showArrow?: boolean;
};

export function SparkAcademyCta({ label, href, variant = "primary", className = "", showArrow = false }: Props) {
  const modal = useLeadModalOptional();
  const modalKind = resolveLeadModalKind(href);

  const classes = `sa-btn sa-btn--${variant} ${className}`.trim();
  const content = (
    <>
      {label}
      {showArrow ? <span className="sa-btn__arrow" aria-hidden>→</span> : null}
    </>
  );

  if (modalKind && modal) {
    return (
      <button type="button" className={classes} onClick={() => modal.openModal(modalKind)}>
        {content}
      </button>
    );
  }

  return (
    <a href={href} className={classes}>
      {content}
    </a>
  );
}
