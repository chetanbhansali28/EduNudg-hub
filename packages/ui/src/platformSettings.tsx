import type { ReactNode } from "react";

export function PlatformSettingsShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={["ed-pfset", className].filter(Boolean).join(" ")}>{children}</div>;
}

export function PlatformSettingsPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="ed-pfset-header">
      <div className="ed-pfset-header__copy">
        <h1 className="ed-pfset-header__title">{title}</h1>
        {subtitle ? <p className="ed-pfset-header__subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="ed-pfset-header__actions">{actions}</div> : null}
    </header>
  );
}

export function PlatformSettingsVisibility({
  mobile,
  desktop,
}: {
  mobile: ReactNode;
  desktop: ReactNode;
}) {
  return (
    <>
      <div className="ed-pfset-only-mobile">{mobile}</div>
      <div className="ed-pfset-only-desktop">{desktop}</div>
    </>
  );
}

export function PlatformSettingsGrid({ children }: { children: ReactNode }) {
  return <div className="ed-pfset-grid">{children}</div>;
}

export function PlatformSettingsCard({
  children,
  className,
  span = 1,
}: {
  children: ReactNode;
  className?: string;
  span?: 1 | 2;
}) {
  return (
    <section
      className={["ed-pfset-card", span === 2 ? "ed-pfset-card--wide" : "", className].filter(Boolean).join(" ")}
    >
      {children}
    </section>
  );
}

export function PlatformSettingsCardHeader({
  icon,
  title,
  badge,
  status,
  action,
}: {
  icon?: ReactNode;
  title: string;
  badge?: ReactNode;
  status?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="ed-pfset-card__head">
      <div className="ed-pfset-card__head-main">
        {icon ? <span className="ed-pfset-card__icon">{icon}</span> : null}
        <div>
          <div className="ed-pfset-card__title-row">
            <h2 className="ed-pfset-card__title">{title}</h2>
            {badge}
            {status}
          </div>
        </div>
      </div>
      {action}
    </div>
  );
}

export function PlatformSettingsBadge({
  children,
  tone = "blue",
}: {
  children: ReactNode;
  tone?: "blue" | "green";
}) {
  return <span className={`ed-pfset-badge ed-pfset-badge--${tone}`}>{children}</span>;
}

export function PlatformSettingsToggleRow({
  icon,
  title,
  description,
  checked,
  onChange,
  disabled,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="ed-pfset-toggle-row">
      {icon ? <span className="ed-pfset-toggle-row__icon">{icon}</span> : null}
      <div className="ed-pfset-toggle-row__copy">
        <p className="ed-pfset-toggle-row__title">{title}</p>
        {description ? <p className="ed-pfset-toggle-row__description">{description}</p> : null}
      </div>
      <label className="ed-pfset-switch">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="ed-pfset-switch__track" aria-hidden />
      </label>
    </div>
  );
}

export function PlatformSettingsActionButton({
  icon,
  label,
  onClick,
  href,
}: {
  icon?: ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
}) {
  const className = "ed-pfset-action-btn";
  const content = (
    <>
      {icon ? <span className="ed-pfset-action-btn__icon">{icon}</span> : null}
      <span className="ed-pfset-action-btn__label">{label}</span>
      <span className="ed-pfset-action-btn__chevron" aria-hidden>
        ›
      </span>
    </>
  );
  if (href) {
    return (
      <a className={className} href={href}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" className={className} onClick={onClick}>
      {content}
    </button>
  );
}

export function PlatformSettingsProviderCard({
  logo,
  title,
  meta,
  action,
}: {
  logo?: ReactNode;
  title: string;
  meta: string;
  action?: ReactNode;
}) {
  return (
    <div className="ed-pfset-provider">
      <div className="ed-pfset-provider__main">
        {logo ? <span className="ed-pfset-provider__logo">{logo}</span> : null}
        <div>
          <p className="ed-pfset-provider__title">{title}</p>
          <p className="ed-pfset-provider__meta">{meta}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

export function PlatformSettingsStatGrid({ children }: { children: ReactNode }) {
  return <div className="ed-pfset-stat-grid">{children}</div>;
}

export function PlatformSettingsStatBox({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  tone?: "default" | "success";
}) {
  return (
    <div className="ed-pfset-stat-box">
      <p className="ed-pfset-stat-box__label">{label}</p>
      <p className={`ed-pfset-stat-box__value ed-pfset-stat-box__value--${tone}`}>{value}</p>
    </div>
  );
}

export function PlatformSettingsOutlineButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button type="button" className="ed-pfset-outline-btn" onClick={onClick}>
      {children}
    </button>
  );
}

export function PlatformSettingsDomainField({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status?: ReactNode;
}) {
  return (
    <div className="ed-pfset-domain">
      <p className="ed-pfset-domain__label">{label}</p>
      <div className="ed-pfset-domain__field">
        <span className="ed-pfset-domain__link-icon" aria-hidden>
          🔗
        </span>
        <span className="ed-pfset-domain__value">{value}</span>
        {status}
      </div>
    </div>
  );
}

export function PlatformSettingsGhostButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button type="button" className="ed-pfset-ghost-btn" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function PlatformSettingsPrimaryButton({
  children,
  onClick,
  disabled,
  pending,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  pending?: boolean;
}) {
  return (
    <button type="button" className="ed-pfset-primary-btn" onClick={onClick} disabled={disabled || pending}>
      {pending ? "Saving…" : children}
    </button>
  );
}

export function PlatformSettingsStatus({
  label,
  tone = "success",
}: {
  label: string;
  tone?: "success" | "neutral";
}) {
  return <span className={`ed-pfset-status ed-pfset-status--${tone}`}>{label}</span>;
}
