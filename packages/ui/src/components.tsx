import { useState, useId, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { IconEye, IconEyeOff } from "./icons";

export {
  ThemeProvider,
  AppShell,
  LoginLayout,
  ComingSoonPage,
  SidebarNavLink,
  type ShellNavItem,
  type ShellNavSection,
  type LoginBrandingProps,
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
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="ed-kpi">
      <div className="ed-kpi__label">{label}</div>
      <div className="ed-kpi__value">{value}</div>
      {hint && <div className="ed-kpi__hint">{hint}</div>}
    </div>
  );
}

export function KpiGrid({ children }: { children: ReactNode }) {
  return <div className="ed-kpi-grid">{children}</div>;
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
  variant?: "primary" | "ghost" | "danger";
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  block?: boolean;
}) {
  const variantClass =
    variant === "primary" ? "ed-btn--primary" : variant === "danger" ? "ed-btn--danger" : "ed-btn--ghost";
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  step?: string;
  editable?: boolean;
}) {
  return (
    <label className={`ed-field${editable ? " ed-field--editable" : ""}`}>
      <span className="ed-field__label">{label}</span>
      <input
        className="ed-field__input"
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        step={step}
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="ed-field ed-field--password">
      <span className="ed-field__label">{label}</span>
      <div className="ed-field__input-wrap">
        <input
          className="ed-field__input"
          type={visible ? "text" : "password"}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
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
}: {
  label: string;
  value: T | "";
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  placeholder?: string;
  editable?: boolean;
}) {
  return (
    <label className={`ed-field${editable ? " ed-field--editable" : ""}`}>
      <span className="ed-field__label">{label}</span>
      <select
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
}: {
  items: T[];
  render: (item: T) => ReactNode;
  empty?: string;
}) {
  if (items.length === 0) {
    return <p className="ed-empty">{empty ?? "No items yet."}</p>;
  }
  return (
    <div className="ed-data-list">
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

export function ListRow({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="ed-list-row">
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="ed-field">
      <span className="ed-field__label">{label}</span>
      <textarea
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
