import type { ReactNode } from "react";

export function SubscriptionShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={["ed-sub", className].filter(Boolean).join(" ")}>{children}</div>;
}

export function SubscriptionPageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="ed-sub-header">
      <h1 className="ed-sub-header__title">{title}</h1>
      {subtitle ? <p className="ed-sub-header__subtitle">{subtitle}</p> : null}
    </header>
  );
}

export function SubscriptionSectionHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="ed-sub-section-header">
      <h2 className="ed-sub-section-header__title">{title}</h2>
      {action ? <div className="ed-sub-section-header__action">{action}</div> : null}
    </div>
  );
}

export function SubscriptionBillingToggle({
  value,
  onChange,
}: {
  value: "monthly" | "yearly";
  onChange: (value: "monthly" | "yearly") => void;
}) {
  return (
    <div className="ed-sub-billing-toggle" role="group" aria-label="Billing period">
      <button
        type="button"
        className={`ed-sub-billing-toggle__btn${value === "monthly" ? " is-active" : ""}`}
        aria-pressed={value === "monthly"}
        onClick={() => onChange("monthly")}
      >
        Monthly
      </button>
      <button
        type="button"
        className={`ed-sub-billing-toggle__btn${value === "yearly" ? " is-active" : ""}`}
        aria-pressed={value === "yearly"}
        onClick={() => onChange("yearly")}
      >
        Yearly <span className="ed-sub-billing-toggle__badge">-20%</span>
      </button>
    </div>
  );
}

export type SubscriptionPlanTone = "starter" | "growth" | "enterprise" | "neutral";

export type SubscriptionPlanFeature = {
  key: string;
  label: string;
  included: boolean;
};

export function SubscriptionPlanGrid({ children }: { children: ReactNode }) {
  return <div className="ed-sub-plan-grid">{children}</div>;
}

export function SubscriptionPlanCarousel({ children }: { children: ReactNode }) {
  return <div className="ed-sub-plan-carousel">{children}</div>;
}

export function SubscriptionPlanCard({
  tierLabel,
  priceLabel,
  intervalLabel,
  features,
  tone = "neutral",
  featured = false,
  selected = false,
  actionLabel = "Edit Plan",
  onAction,
}: {
  tierLabel: string;
  priceLabel: string;
  intervalLabel?: string;
  features: SubscriptionPlanFeature[];
  tone?: SubscriptionPlanTone;
  featured?: boolean;
  selected?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <article
      className={[
        "ed-sub-plan-card",
        `ed-sub-plan-card--${tone}`,
        featured ? "ed-sub-plan-card--featured" : "",
        selected ? "ed-sub-plan-card--selected" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {featured ? (
        <span className="ed-sub-plan-card__star" aria-hidden>
          ★
        </span>
      ) : null}
      <p className="ed-sub-plan-card__tier">{tierLabel}</p>
      <p className="ed-sub-plan-card__price">
        {priceLabel}
        {intervalLabel ? <span className="ed-sub-plan-card__interval">{intervalLabel}</span> : null}
      </p>
      <ul className="ed-sub-plan-card__features">
        {features.map((feature) => (
          <li
            key={feature.key}
            className={`ed-sub-plan-card__feature${feature.included ? " is-included" : " is-excluded"}`}
          >
            <span className="ed-sub-plan-card__feature-icon" aria-hidden>
              {feature.included ? "✓" : "○"}
            </span>
            {feature.label}
          </li>
        ))}
      </ul>
      {onAction ? (
        <button type="button" className="ed-sub-plan-card__action" onClick={onAction}>
          {selected ? "Selected" : actionLabel}
        </button>
      ) : null}
    </article>
  );
}

export function SubscriptionEditorPanel({
  title,
  subtitle,
  onDiscard,
  onSave,
  savePending = false,
  saveDisabled = false,
  children,
}: {
  title: string;
  subtitle?: string;
  onDiscard?: () => void;
  onSave: () => void;
  savePending?: boolean;
  saveDisabled?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="ed-sub-editor">
      <div className="ed-sub-editor__head">
        <div>
          <h2 className="ed-sub-editor__title">{title}</h2>
          {subtitle ? <p className="ed-sub-editor__subtitle">{subtitle}</p> : null}
        </div>
        <div className="ed-sub-editor__actions">
          {onDiscard ? (
            <button type="button" className="ed-sub-editor__discard" onClick={onDiscard}>
              Discard
            </button>
          ) : null}
          <button
            type="button"
            className="ed-sub-editor__save"
            onClick={onSave}
            disabled={saveDisabled || savePending}
          >
            {savePending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
      <div className="ed-sub-editor__body">{children}</div>
    </section>
  );
}

export function SubscriptionAccordion({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className={`ed-sub-accordion${open ? " is-open" : ""}`}>
      <button type="button" className="ed-sub-accordion__trigger" onClick={onToggle} aria-expanded={open}>
        <span>{title}</span>
        <span className="ed-sub-accordion__chevron" aria-hidden>
          ▾
        </span>
      </button>
      {open ? <div className="ed-sub-accordion__body">{children}</div> : null}
    </section>
  );
}

export function SubscriptionFeatureEntitlements({
  title = "Feature Entitlements",
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <section className="ed-sub-entitlements">
      <h3 className="ed-sub-entitlements__title">{title}</h3>
      <div className="ed-sub-entitlements__body">{children}</div>
    </section>
  );
}

export function SubscriptionEntitlementRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="ed-sub-entitlement-row">
      <div className="ed-sub-entitlement-row__copy">
        <p className="ed-sub-entitlement-row__label">{label}</p>
        {description ? <p className="ed-sub-entitlement-row__description">{description}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`ed-toggle${checked ? " ed-toggle--on" : ""}`}
        disabled={disabled}
        onClick={() => onChange(!checked)}
      >
        <span className="ed-toggle__thumb" aria-hidden />
      </button>
    </div>
  );
}

export function SubscriptionTableToolbar({
  searchValue,
  onSearchChange,
  onFilterClick,
  searchPlaceholder = "Search brands…",
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onFilterClick?: () => void;
  searchPlaceholder?: string;
}) {
  return (
    <div className="ed-sub-table-toolbar">
      <label className="ed-sub-table-toolbar__search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="search"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
        />
      </label>
      {onFilterClick ? (
        <button type="button" className="ed-sub-table-toolbar__filter" onClick={onFilterClick}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          Filter
        </button>
      ) : null}
    </div>
  );
}

export function SubscriptionDataTable({
  columns,
  rows,
  emptyMessage = "No subscriptions yet.",
}: {
  columns: { key: string; label: string; align?: "right" }[];
  rows: { key: string; cells: Record<string, ReactNode> }[];
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return <p className="ed-sub-table__empty">{emptyMessage}</p>;
  }

  return (
    <div className="ed-sub-table-wrap">
      <table className="ed-sub-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={column.align === "right" ? "ed-sub-table__align-right" : undefined}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={column.align === "right" ? "ed-sub-table__align-right" : undefined}
                >
                  {row.cells[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SubscriptionPlanBadge({
  label,
  tone = "growth",
}: {
  label: string;
  tone?: SubscriptionPlanTone;
}) {
  return <span className={`ed-sub-plan-badge ed-sub-plan-badge--${tone}`}>{label}</span>;
}

export function SubscriptionStatusBadge({
  label,
  tone = "active",
}: {
  label: string;
  tone?: "active" | "inactive" | "expired" | "warning";
}) {
  return (
    <span className={`ed-sub-status-badge ed-sub-status-badge--${tone}`}>
      <span className="ed-sub-status-badge__dot" aria-hidden />
      {label}
    </span>
  );
}

export function SubscriptionBrandCell({
  initials,
  name,
}: {
  initials: string;
  name: string;
}) {
  return (
    <div className="ed-sub-brand-cell">
      <span className="ed-sub-brand-cell__avatar" aria-hidden>
        {initials}
      </span>
      <span className="ed-sub-brand-cell__name">{name}</span>
    </div>
  );
}

export function SubscriptionBrandCard({
  name,
  planLabel,
  status,
  menu,
}: {
  name: string;
  planLabel: string;
  status: ReactNode;
  menu?: ReactNode;
}) {
  return (
    <article className="ed-sub-brand-card">
      <div className="ed-sub-brand-card__copy">
        <p className="ed-sub-brand-card__name">{name}</p>
        <p className="ed-sub-brand-card__meta">
          {planLabel} • {status}
        </p>
      </div>
      {menu ? <div className="ed-sub-brand-card__menu">{menu}</div> : null}
    </article>
  );
}

export function SubscriptionVisibility({
  mobile,
  desktop,
}: {
  mobile?: ReactNode;
  desktop?: ReactNode;
}) {
  return (
    <>
      {mobile ? <div className="ed-sub-only-mobile">{mobile}</div> : null}
      {desktop ? <div className="ed-sub-only-desktop">{desktop}</div> : null}
    </>
  );
}

export function SubscriptionLinkButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button type="button" className="ed-sub-link-btn" onClick={onClick}>
      {children}
    </button>
  );
}

export function SubscriptionPrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button type="button" className="ed-sub-primary-btn" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function SubscriptionIconMenuButton({
  label,
  onClick,
}: {
  label: string;
  onClick?: () => void;
}) {
  return (
    <button type="button" className="ed-sub-icon-menu" aria-label={label} onClick={onClick}>
      ⋮
    </button>
  );
}

export function SubscriptionTableActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="ed-sub-table-actions">
      <button type="button" className="ed-sub-table-actions__btn" aria-label="Edit" onClick={onEdit}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      </button>
      <button
        type="button"
        className="ed-sub-table-actions__btn ed-sub-table-actions__btn--danger"
        aria-label="Delete"
        onClick={onDelete}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
        </svg>
      </button>
    </div>
  );
}
