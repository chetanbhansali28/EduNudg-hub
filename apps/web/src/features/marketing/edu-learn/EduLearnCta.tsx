import type { ReactNode } from "react";
import { useLeadModalOptional } from "@/features/marketing/abacus-classic/LeadModalContext";
import { resolveLeadModalKind } from "@/features/marketing/abacus-classic/MarketingLeadModals";

type Props = {
  label: string;
  href: string;
  className?: string;
  icon?: boolean;
  variant?: "fill" | "outline";
  onClick?: () => void;
};

export function EduLearnCta({
  label,
  href,
  className = "",
  icon = false,
  variant = "fill",
  onClick,
}: Props) {
  const modal = useLeadModalOptional();
  const modalKind = resolveLeadModalKind(href);
  const classes = `el-btn el-btn--${variant}${icon ? " el-btn--icon" : ""} ${className}`.trim();
  const content = icon ? <span aria-hidden>→</span> : label;

  if (modalKind && modal) {
    return (
      <button
        type="button"
        className={classes}
        aria-label={icon ? label : undefined}
        onClick={() => {
          onClick?.();
          modal.openModal(modalKind);
        }}
      >
        {content}
      </button>
    );
  }

  return (
    <a href={href} className={classes} aria-label={icon ? label : undefined} onClick={onClick}>
      {content}
    </a>
  );
}

export function EduLearnMark({
  children,
  tone = "orange",
}: {
  children: ReactNode;
  tone?: "orange" | "green";
}) {
  return <span className={tone === "green" ? "el-mark el-mark--green" : "el-mark"}>{children}</span>;
}
