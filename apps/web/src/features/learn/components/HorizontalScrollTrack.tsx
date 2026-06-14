import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  ariaLabel: string;
  className?: string;
};

/** Horizontal scroll row with snap — used for batch join and learning path on the dashboard. */
export function HorizontalScrollTrack({ children, ariaLabel, className }: Props) {
  return (
    <div
      className={["ed-sp-hscroll", className].filter(Boolean).join(" ")}
      role="region"
      aria-label={ariaLabel}
      tabIndex={0}
    >
      <div className="ed-sp-hscroll__track">{children}</div>
    </div>
  );
}
