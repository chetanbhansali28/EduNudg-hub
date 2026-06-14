import { useState, useId, type ReactNode } from "react";

function fieldNameFromLabel(label: string): string {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "field";
}
import { Link } from "react-router-dom";
import { IconEye, IconEyeOff } from "./icons";

export {
  ThemeProvider,
  useAdminTheme,
  readAdminTheme,
  writeAdminTheme,
  AppShell,
  LoginLayout,
  ComingSoonPage,
  SidebarNavLink,
  type ShellNavItem,
  type ShellNavSection,
  type LoginBrandingProps,
  type LoginFooterLink,
} from "./shell";

/** @deprecated Use AppShell navSections with react-router Link */
export function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <Link to={href} className={["ed-nav-link", active ? "ed-nav-link--active" : ""].filter(Boolean).join(" ")}>
      {children}
    </Link>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  onClick,
  active,
}: {
  label: string;
  value: string | number;
  hint?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  const className = [
    "ed-kpi",
    onClick ? "ed-kpi--clickable" : "",
    active ? "ed-kpi--active" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick} aria-pressed={active}>
        <div className="ed-kpi__label">{label}</div>
        <div className="ed-kpi__value">{value}</div>
        {hint && <div className="ed-kpi__hint">{hint}</div>}
      </button>
    );
  }

  return (
    <div className={className}>
      <div className="ed-kpi__label">{label}</div>
      <div className="ed-kpi__value">{value}</div>
      {hint && <div className="ed-kpi__hint">{hint}</div>}
    </div>
  );
}

export function KpiGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={["ed-kpi-grid", className].filter(Boolean).join(" ")}>{children}</div>;
}

export function Button({
  children,
  variant = "primary",
  onClick,
  type = "button",
  disabled,
  block,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "oauth-google" | "oauth-whatsapp";
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  block?: boolean;
}) {
  const variantClass =
    variant === "primary"
      ? "ed-btn--primary"
      : variant === "secondary"
        ? "ed-btn--secondary"
        : variant === "danger"
          ? "ed-btn--danger"
          : variant === "oauth-google"
            ? "ed-btn--oauth-google"
            : variant === "oauth-whatsapp"
              ? "ed-btn--oauth-whatsapp"
              : "ed-btn--ghost";
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={["ed-btn", variantClass, block ? "ed-btn--block" : ""].filter(Boolean).join(" ")}
    >
      {children}
    </button>
  );
}

/** Primary save action with consistent pending / saved labels for admin forms. */
export function SaveButton({
  onClick,
  pending = false,
  saved = false,
  disabled,
  label = "Save",
  block,
}: {
  onClick: () => void;
  pending?: boolean;
  saved?: boolean;
  disabled?: boolean;
  label?: string;
  block?: boolean;
}) {
  return (
    <Button onClick={onClick} disabled={disabled ?? pending} block={block}>
      {pending ? "Saving…" : saved ? "Saved" : label}
    </Button>
  );
}

/** Right-aligned row for form submit actions (Save, etc.). */
export function FormActions({ children }: { children: ReactNode }) {
  return <div className="ed-form-actions">{children}</div>;
}

export type DraftPublishedValue = "draft" | "published";

/** Adjacent Draft / Published controls using primary + ghost button styles. */
export function DraftPublishedToggle({
  value,
  onChange,
  disabled,
  "aria-label": ariaLabel = "Publication status",
}: {
  value: DraftPublishedValue;
  onChange: (value: DraftPublishedValue) => void;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  return (
    <div className="ed-toggle-choice" role="group" aria-label={ariaLabel}>
      <button
        type="button"
        className={`ed-btn ed-toggle-choice__btn${value === "draft" ? " ed-btn--primary" : " ed-btn--ghost"}`}
        aria-pressed={value === "draft"}
        disabled={disabled}
        onClick={() => onChange("draft")}
      >
        Draft
      </button>
      <button
        type="button"
        className={`ed-btn ed-toggle-choice__btn${value === "published" ? " ed-btn--primary" : " ed-btn--ghost"}`}
        aria-pressed={value === "published"}
        disabled={disabled}
        onClick={() => onChange("published")}
      >
        Published
      </button>
    </div>
  );
}

export function Card({ title, children, actions }: { title?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="ed-card">
      {(title || actions) && (
        <div className="ed-card__header">
          {title && <h2 className="ed-card__title">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}

export function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  step,
  editable = false,
  disabled,
  id,
  name,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  step?: string;
  editable?: boolean;
  disabled?: boolean;
  id?: string;
  name?: string;
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const inputName = name ?? fieldNameFromLabel(label);
  return (
    <label className={`ed-field${editable ? " ed-field--editable" : ""}`} htmlFor={inputId}>
      <span className="ed-field__label">{label}</span>
      <input
        id={inputId}
        name={inputName}
        className="ed-field__input"
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        step={step}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function PasswordInput({
  label,
  value,
  onChange,
  placeholder = "Enter a password",
  autoComplete = "current-password",
  disabled,
  id,
  name,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
}) {
  const [visible, setVisible] = useState(false);
  const autoId = useId();
  const inputId = id ?? autoId;
  const inputName = name ?? fieldNameFromLabel(label);

  return (
    <label className="ed-field ed-field--password" htmlFor={inputId}>
      <span className="ed-field__label">{label}</span>
      <div className="ed-field__input-wrap">
        <input
          id={inputId}
          name={inputName}
          className="ed-field__input"
          type={visible ? "text" : "password"}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="ed-field__toggle"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <IconEyeOff width={18} height={18} /> : <IconEye width={18} height={18} />}
        </button>
      </div>
    </label>
  );
}

export function Select<T extends string>({
  label,
  value,
  onChange,
  options,
  placeholder,
  editable = false,
  id,
  name,
}: {
  label: string;
  value: T | "";
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  placeholder?: string;
  editable?: boolean;
  id?: string;
  name?: string;
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const inputName = name ?? fieldNameFromLabel(label);
  return (
    <label className={`ed-field${editable ? " ed-field--editable" : ""}`} htmlFor={inputId}>
      <span className="ed-field__label">{label}</span>
      <select
        id={inputId}
        name={inputName}
        className="ed-field__input"
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function MutationError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="ed-text-sm" role="alert" style={{ color: "var(--ed-danger, #b91c1c)" }}>
      {message}
    </p>
  );
}

export function DataList<T extends { id: string }>({
  items,
  render,
  empty,
  variant = "default",
}: {
  items: T[];
  render: (item: T) => ReactNode;
  empty?: ReactNode;
  /** pipeline = compact rows for lead/application queues */
  variant?: "default" | "pipeline";
}) {
  if (items.length === 0) {
    if (empty != null) {
      return typeof empty === "string" ? <p className="ed-empty">{empty}</p> : empty;
    }
    return <p className="ed-empty">No items yet.</p>;
  }
  return (
    <div className={variant === "pipeline" ? "ed-data-list ed-data-list--pipeline" : "ed-data-list"}>
      {items.map((item) => (
        <div key={item.id} className="ed-data-list__item">
          {render(item)}
        </div>
      ))}
    </div>
  );
}

export function Badge({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "success" | "warning" }) {
  return <span className={`ed-badge ed-badge--${tone}`}>{children}</span>;
}

export function PageTitle({ children }: { children: ReactNode }) {
  return <h2 className="ed-page-title">{children}</h2>;
}

export function PageToolbar({
  title,
  subtitle,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="ed-page-toolbar">
      <div>
        {typeof title === "string" ? (
          <h2 className={`ed-page-title${subtitle ? " ed-page-title--with-sub" : ""}`}>{title}</h2>
        ) : (
          title
        )}
        {subtitle && <p className="ed-muted ed-text-sm ed-page-toolbar__subtitle">{subtitle}</p>}
      </div>
      {children && <div className="ed-page-toolbar__actions">{children}</div>}
    </div>
  );
}

export function ListRow({
  children,
  aside,
  className,
}: {
  children: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <div className={["ed-list-row", className].filter(Boolean).join(" ")}>
      <div className="ed-list-row__main">{children}</div>
      {aside ? <div className="ed-list-row__aside">{aside}</div> : null}
    </div>
  );
}

/** App content grid: 1 col mobile, 2 col tablet, 3 col desktop (when cols=3). */
export function PageGrid({
  children,
  cols = 3,
  className,
}: {
  children: ReactNode;
  cols?: 2 | 3;
  className?: string;
}) {
  const colClass = cols === 2 ? "ed-page-grid--2" : "ed-page-grid--3";
  return <div className={["ed-page-grid", colClass, className].filter(Boolean).join(" ")}>{children}</div>;
}

/** Full-width row inside PageGrid (forms, tables). */
export function PageGridFull({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={["ed-page-grid__full", className].filter(Boolean).join(" ")}>{children}</div>;
}

/** Two-column form fields from tablet up; pass columns={3} for three fields on desktop. */
export function FormGrid({ children, columns }: { children: ReactNode; columns?: 2 | 3 }) {
  return (
    <div className={`ed-form-grid${columns === 3 ? " ed-form-grid--3" : ""}`}>{children}</div>
  );
}

export function Textarea({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
  editable = false,
  id,
  name,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  editable?: boolean;
  id?: string;
  name?: string;
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const inputName = name ?? fieldNameFromLabel(label);
  return (
    <label className={`ed-field${editable ? " ed-field--editable" : ""}`} htmlFor={inputId}>
      <span className="ed-field__label">{label}</span>
      <textarea
        id={inputId}
        name={inputName}
        className="ed-field__input"
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

/** Responsive grid for boolean toggle fields: 2 columns mobile/tablet, 3 on desktop. */
export function ToggleGrid({ children }: { children: ReactNode }) {
  return <div className="ed-toggle-grid">{children}</div>;
}

export function Toggle({
  checked,
  onChange,
  disabled,
  id,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      className={["ed-toggle", checked ? "ed-toggle--on" : ""].filter(Boolean).join(" ")}
      onClick={() => onChange(!checked)}
    >
      <span className="ed-toggle__thumb" aria-hidden />
    </button>
  );
}

export function ToggleField({
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
  const id = useId();
  return (
    <div className="ed-toggle-field">
      <div className="ed-toggle-field__body">
        <label className="ed-toggle-field__label" htmlFor={id}>
          {label}
        </label>
        {description ? <p className="ed-toggle-field__description">{description}</p> : null}
      </div>
      <Toggle id={id} checked={checked} onChange={onChange} disabled={disabled} aria-label={label} />
    </div>
  );
}

export function FilterTabs<T extends string>({
  options,
  value,
  onChange,
  variant = "default",
  "aria-label": ariaLabel = "Filter",
}: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  variant?: "default" | "segmented";
  "aria-label"?: string;
}) {
  return (
    <div
      className={["ed-filter-tabs", variant === "segmented" ? "ed-filter-tabs--segmented" : ""]
        .filter(Boolean)
        .join(" ")}
      role="tablist"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const active = option.value === value;
        const label =
          option.count != null ? `${option.label} (${option.count})` : option.label;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            className={`ed-filter-tabs__btn${active ? " is-active" : ""}`}
            aria-selected={active}
            onClick={() => onChange(option.value)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function PipelineMasterDetail({
  list,
  detail,
}: {
  list: ReactNode;
  detail?: ReactNode;
}) {
  return (
    <div className="ed-pipeline-layout">
      <div className="ed-pipeline-layout__list">{list}</div>
      {detail ? <div className="ed-pipeline-layout__detail">{detail}</div> : null}
    </div>
  );
}

export function PipelineListItem({
  title,
  meta,
  lines,
  badges,
  initials,
  when,
  selected,
  linked,
  onSelect,
}: {
  title: string;
  meta?: string;
  lines?: string[];
  badges?: ReactNode;
  initials?: string;
  when?: string;
  selected?: boolean;
  linked?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`ed-pipeline-item${selected ? " ed-pipeline-item--selected" : ""}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      {linked ? <span className="ed-pipeline-item__linked">LINKED</span> : null}
      {initials && (
        <span className="ed-pipeline-item__avatar" aria-hidden>
          {initials}
        </span>
      )}
      <span className="ed-pipeline-item__body">
        <span className="ed-pipeline-item__title-row">
          <span className="ed-pipeline-item__title">{title}</span>
          {when && <span className="ed-pipeline-item__when">{when}</span>}
        </span>
        {meta && <span className="ed-pipeline-item__meta">{meta}</span>}
        {lines?.map((line) => (
          <span key={line} className="ed-pipeline-item__line">
            {line}
          </span>
        ))}
        {badges && <span className="ed-pipeline-item__badges">{badges}</span>}
      </span>
    </button>
  );
}

export function PipelineEmptyState({
  message,
  actionLabel,
  onAction,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="ed-pipeline-empty">
      <p className="ed-pipeline-empty__message">{message}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}

export function PipelineDetailPlaceholder({ message }: { message: string }) {
  return (
    <Card title="Details">
      <p className="ed-text-sm ed-muted ed-pipeline-detail-placeholder">{message}</p>
    </Card>
  );
}

export function QuantityStepper({
  value,
  onChange,
  min = 0,
  disabled,
  "aria-label": ariaLabel = "Quantity",
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  return (
    <div className="ed-qty-stepper" aria-label={ariaLabel}>
      <button
        type="button"
        className="ed-qty-stepper__btn"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="ed-qty-stepper__value" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="ed-qty-stepper__btn"
        onClick={() => onChange(value + 1)}
        disabled={disabled}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}

export function MobileCartBar({
  itemCount,
  totalLabel,
  onOpen,
  openLabel = "View Cart",
}: {
  itemCount: number;
  totalLabel: string;
  onOpen: () => void;
  openLabel?: string;
}) {
  if (itemCount <= 0) return null;

  return (
    <div className="ed-cart-bar">
      <button type="button" className="ed-cart-bar__btn" onClick={onOpen}>
        <span className="ed-cart-bar__icon" aria-hidden>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
        </span>
        <span className="ed-cart-bar__summary">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </span>
        <span className="ed-cart-bar__dot" aria-hidden>
          ·
        </span>
        <span className="ed-cart-bar__total">{totalLabel}</span>
        <span className="ed-cart-bar__action">
          {openLabel} →
        </span>
      </button>
    </div>
  );
}

export function BottomNav({
  items,
  "aria-label": ariaLabel = "Primary",
}: {
  items: { href: string; label: string; icon: ReactNode; active?: boolean }[];
  "aria-label"?: string;
}) {
  return (
    <nav className="ed-bottom-nav" aria-label={ariaLabel}>
      {items.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          className={`ed-bottom-nav__item${item.active ? " ed-bottom-nav__item--active" : ""}`}
          aria-current={item.active ? "page" : undefined}
        >
          <span className="ed-bottom-nav__icon">{item.icon}</span>
          <span className="ed-bottom-nav__label">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function OpsPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="ed-ops-page-header">
      <div>
        <h1 className="ed-ops-page-header__title">{title}</h1>
        {subtitle ? <p className="ed-ops-page-header__subtitle">{subtitle}</p> : null}
      </div>
      {action ? <div className="ed-ops-page-header__action">{action}</div> : null}
    </header>
  );
}

export function OpsListHeader({ title, badge }: { title: string; badge?: string }) {
  return (
    <div className="ed-ops-list-header">
      <h2 className="ed-ops-list-header__title">{title}</h2>
      {badge ? <span className="ed-ops-list-header__badge">{badge}</span> : null}
    </div>
  );
}

export function OpsSearchField({
  value,
  onChange,
  placeholder = "Search…",
  onFilterClick,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFilterClick?: () => void;
}) {
  return (
    <div className="ed-ops-search-row">
      <label className="ed-ops-search">
        <span className="ed-ops-search__icon" aria-hidden>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </span>
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </label>
      {onFilterClick ? (
        <button type="button" className="ed-ops-filter-btn" aria-label="Filter" onClick={onFilterClick}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}

export function OpsMobileFab({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="ed-ops-fab" aria-label={label} onClick={onClick}>
      +
    </button>
  );
}

export function OpsSectionCard({
  icon,
  title,
  description,
  children,
  footer,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="ed-ops-section-card">
      <div className="ed-ops-section-card__head">
        <span className="ed-ops-section-card__icon">{icon}</span>
        <div>
          <h3 className="ed-ops-section-card__title">{title}</h3>
          {description ? <p className="ed-ops-section-card__desc">{description}</p> : null}
        </div>
      </div>
      {children}
      {footer ? <div className="ed-ops-section-card__footer">{footer}</div> : null}
    </section>
  );
}

export type EditorSectionTone = "primary" | "secondary" | "tertiary" | "neutral";

/** Homepage / marketing editor page header with optional last-saved badge. */
export function EditorPageHeader({
  title,
  subtitle,
  lastSavedLabel,
}: {
  title: string;
  subtitle?: ReactNode;
  lastSavedLabel?: string | null;
}) {
  return (
    <header className="ed-editor-page-header">
      <div className="ed-editor-page-header__main">
        <h1 className="ed-editor-page-header__title">{title}</h1>
        {subtitle ? <p className="ed-editor-page-header__subtitle">{subtitle}</p> : null}
      </div>
      {lastSavedLabel ? (
        <p className="ed-editor-page-header__saved">
          <span className="ed-editor-page-header__saved-icon material-symbols-outlined" aria-hidden>
            schedule
          </span>
          {lastSavedLabel}
        </p>
      ) : null}
    </header>
  );
}

/** Always-visible editor section card (Site Identity, Navigation, etc.). */
export function EditorSectionCard({
  icon,
  iconTone = "primary",
  title,
  headerAction,
  children,
}: {
  icon: ReactNode;
  iconTone?: EditorSectionTone;
  title: string;
  headerAction?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="ed-editor-section-card">
      <div className="ed-editor-section-card__header">
        <div className="ed-editor-section-card__title-row">
          <span className={`ed-editor-section-card__icon ed-editor-section-card__icon--${iconTone}`}>
            {icon}
          </span>
          <h2 className="ed-editor-section-card__title">{title}</h2>
        </div>
        {headerAction ? <div className="ed-editor-section-card__action">{headerAction}</div> : null}
      </div>
      <div className="ed-editor-section-card__body">{children}</div>
    </section>
  );
}

/** Sticky draft/save bar for homepage and marketing editors. */
export function EditorSaveBar({
  draftNote = "Changes are currently in draft.",
  savedNote = "All changes saved.",
  isDirty = false,
  onDiscard,
  onSave,
  savePending = false,
  saved = false,
  saveLabel = "Save changes",
  discardLabel = "Discard",
  inline = false,
}: {
  draftNote?: string;
  savedNote?: string;
  isDirty?: boolean;
  onDiscard?: () => void;
  onSave: () => void;
  savePending?: boolean;
  saved?: boolean;
  saveLabel?: string;
  discardLabel?: string;
  /** When true, bar flows at the end of a panel instead of fixed to the viewport. */
  inline?: boolean;
}) {
  return (
    <div
      className={["ed-editor-save-bar", inline ? "ed-editor-save-bar--inline" : ""].filter(Boolean).join(" ")}
      role="region"
      aria-label="Save changes"
    >
      <div className="ed-editor-save-bar__inner">
        <p className="ed-editor-save-bar__status">{isDirty ? draftNote : savedNote}</p>
        <div className="ed-editor-save-bar__actions">
          {onDiscard && isDirty ? (
            <Button variant="secondary" onClick={onDiscard} disabled={savePending}>
              {discardLabel}
            </Button>
          ) : null}
          <SaveButton
            onClick={onSave}
            pending={savePending}
            saved={saved}
            label={saveLabel}
            disabled={!isDirty && !savePending && !saved}
          />
        </div>
      </div>
    </div>
  );
}
