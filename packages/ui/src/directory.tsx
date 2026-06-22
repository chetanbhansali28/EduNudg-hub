import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export type DirectoryTone = "blue" | "purple" | "green" | "magenta";

export function DirectoryShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={["ed-directory", className].filter(Boolean).join(" ")}>{children}</div>;
}

export function DirectoryPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="ed-directory-header">
      <div className="ed-directory-header__copy">
        <h1 className="ed-directory-header__title">{title}</h1>
        {subtitle ? <p className="ed-directory-header__subtitle">{subtitle}</p> : null}
      </div>
      {action ? <div className="ed-directory-header__action">{action}</div> : null}
    </header>
  );
}

export function DirectoryMobileToolbar({
  title,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search brands…",
  action,
}: {
  title: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  action?: ReactNode;
}) {
  return (
    <header className="ed-directory-mobile-toolbar">
      <div className="ed-directory-mobile-toolbar__row">
        <h1 className="ed-directory-mobile-toolbar__title">{title}</h1>
        <div className="ed-directory-mobile-toolbar__actions">
          {onSearchChange ? (
            <label className="ed-directory-mobile-toolbar__search">
              <span className="ed-sr-only">{searchPlaceholder}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="search"
                value={searchValue ?? ""}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={searchPlaceholder}
              />
            </label>
          ) : null}
          {action}
        </div>
      </div>
    </header>
  );
}

export function DirectorySummaryStrip({ children }: { children: ReactNode }) {
  return <div className="ed-directory-summary">{children}</div>;
}

export function DirectorySummaryCard({
  label,
  value,
  icon,
  iconTone = "purple",
  onClick,
  href,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  iconTone?: DirectoryTone;
  onClick?: () => void;
  href?: string;
}) {
  const className = `ed-directory-summary-card ed-directory-summary-card--${iconTone}`;
  const body = (
    <>
      <div className="ed-directory-summary-card__copy">
        <p className="ed-directory-summary-card__label">{label}</p>
        <p className="ed-directory-summary-card__value">{value}</p>
      </div>
      <span className="ed-directory-summary-card__icon" aria-hidden>
        {icon}
      </span>
    </>
  );

  if (href) {
    return (
      <Link to={href} className={className}>
        {body}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {body}
      </button>
    );
  }

  return <article className={className}>{body}</article>;
}

export function DirectoryNoticePanel({
  title,
  description,
  status,
  statusIcon,
  children,
}: {
  title: string;
  description: ReactNode;
  status?: ReactNode;
  statusIcon?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="ed-directory-notice">
      <div className="ed-directory-notice__head">
        <div>
          <h2 className="ed-directory-notice__title">{title}</h2>
          <p className="ed-directory-notice__description">{description}</p>
        </div>
        {status ? (
          <div className="ed-directory-notice__status">
            {statusIcon}
            <span>{status}</span>
          </div>
        ) : null}
      </div>
      {children ? <div className="ed-directory-notice__body">{children}</div> : null}
    </section>
  );
}

export function DirectorySpotlight({
  title,
  subtitle,
  media,
}: {
  title?: string;
  subtitle?: string;
  media?: ReactNode;
}) {
  return (
    <section className="ed-directory-spotlight" aria-label={title ?? "Featured preview"}>
      {media ?? (
        <div className="ed-directory-spotlight__frame" aria-hidden>
          <div className="ed-directory-spotlight__chrome">
            <span />
            <span />
            <span />
          </div>
          <div className="ed-directory-spotlight__mock">
            <div className="ed-directory-spotlight__mock-sidebar" />
            <div className="ed-directory-spotlight__mock-main">
              <div className="ed-directory-spotlight__mock-cards">
                <span />
                <span />
                <span />
              </div>
              <div className="ed-directory-spotlight__mock-chart" />
            </div>
          </div>
        </div>
      )}
      {title ? <p className="ed-directory-spotlight__title">{title}</p> : null}
      {subtitle ? <p className="ed-directory-spotlight__subtitle">{subtitle}</p> : null}
    </section>
  );
}

export function DirectorySectionHeader({
  title,
  sortLabel,
  onSortClick,
}: {
  title: string;
  sortLabel?: string;
  onSortClick?: () => void;
}) {
  return (
    <div className="ed-directory-section-header">
      <h2 className="ed-directory-section-header__title">{title}</h2>
      {sortLabel ? (
        <button type="button" className="ed-directory-section-header__sort" onClick={onSortClick}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          Sort: {sortLabel}
        </button>
      ) : null}
    </div>
  );
}

export function DirectoryStatusBadge({
  label,
  tone = "active",
}: {
  label: string;
  tone?: "active" | "draft" | "warning" | "neutral";
}) {
  return <span className={`ed-directory-status ed-directory-status--${tone}`}>{label}</span>;
}

export function DirectorySlugLink({ slug, href }: { slug: string; href?: string }) {
  const content = (
    <>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
      slug: {slug}
    </>
  );

  if (href) {
    return (
      <Link to={href} className="ed-directory-slug">
        {content}
      </Link>
    );
  }

  return <span className="ed-directory-slug">{content}</span>;
}

export function DirectoryBrandList({ children }: { children: ReactNode }) {
  return <div className="ed-directory-brand-list">{children}</div>;
}

export function DirectoryBrandRow({
  icon,
  name,
  slug,
  slugHref,
  status,
  backendAction,
  editAction,
  deleteAction,
  nameHref,
}: {
  icon?: ReactNode;
  name: string;
  slug: string;
  slugHref?: string;
  status: ReactNode;
  backendAction: ReactNode;
  editAction: ReactNode;
  deleteAction: ReactNode;
  nameHref?: string;
}) {
  const nameNode = nameHref ? (
    <Link to={nameHref} className="ed-directory-brand-row__name">
      {name}
    </Link>
  ) : (
    <p className="ed-directory-brand-row__name">{name}</p>
  );

  return (
    <article className="ed-directory-brand-row">
      {icon ? <span className="ed-directory-brand-row__icon">{icon}</span> : null}
      <div className="ed-directory-brand-row__copy">
        <div className="ed-directory-brand-row__title-row">
          {nameNode}
          {status}
        </div>
        <DirectorySlugLink slug={slug} href={slugHref} />
      </div>
      <div className="ed-directory-brand-row__actions">
        {backendAction}
        {editAction}
        {deleteAction}
      </div>
    </article>
  );
}

export function DirectoryIconAction({
  label,
  onClick,
  href,
  tone = "default",
  children,
}: {
  label: string;
  onClick?: () => void;
  href?: string;
  tone?: "default" | "primary" | "danger";
  children: ReactNode;
}) {
  const className = `ed-directory-icon-action ed-directory-icon-action--${tone}`;

  if (href) {
    return (
      <Link to={href} className={className} aria-label={label}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={className} aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}

export function DirectoryBrandBackendButton({
  label = "Brand backend",
  onClick,
  pending = false,
}: {
  label?: string;
  onClick: () => void;
  pending?: boolean;
}) {
  return (
    <button type="button" className="ed-directory-backend-btn" onClick={onClick} disabled={pending}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
      {pending ? "Opening…" : label}
    </button>
  );
}

export function DirectoryBrandCard({
  icon,
  thumbnail,
  name,
  subtitle,
  status,
  expanded,
  onToggle,
  href,
  actions,
}: {
  icon?: ReactNode;
  thumbnail?: ReactNode;
  name: string;
  subtitle?: string;
  status: ReactNode;
  expanded?: boolean;
  onToggle?: () => void;
  href?: string;
  actions?: ReactNode;
}) {
  const media = thumbnail ?? icon;
  const top = (
    <>
      {media ? <span className="ed-directory-brand-card__media">{media}</span> : null}
      <div className="ed-directory-brand-card__copy">
        <div className="ed-directory-brand-card__title-row">
          <p className="ed-directory-brand-card__name">{name}</p>
          {status}
        </div>
        {subtitle ? <p className="ed-directory-brand-card__subtitle">{subtitle}</p> : null}
      </div>
      {!expanded ? (
        <span className="ed-directory-brand-card__chevron" aria-hidden>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </span>
      ) : null}
    </>
  );

  return (
    <article className={`ed-directory-brand-card${expanded ? " is-expanded" : ""}`}>
      {href && !expanded ? (
        <Link to={href} className="ed-directory-brand-card__top" onClick={onToggle}>
          {top}
        </Link>
      ) : (
        <button type="button" className="ed-directory-brand-card__top" onClick={onToggle} aria-expanded={expanded}>
          {top}
        </button>
      )}
      {expanded && actions ? <div className="ed-directory-brand-card__actions">{actions}</div> : null}
    </article>
  );
}

export function DirectoryMobileActionBar({
  items,
}: {
  items: { key: string; label: string; icon: ReactNode; onClick: () => void; tone?: "default" | "danger" }[];
}) {
  return (
    <div className="ed-directory-mobile-actions">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          className={`ed-directory-mobile-actions__btn${
            item.tone === "danger" ? " ed-directory-mobile-actions__btn--danger" : ""
          }`}
          onClick={item.onClick}
        >
          <span aria-hidden>{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function DirectoryStatGrid({
  children,
  layout = "grid",
}: {
  children: ReactNode;
  layout?: "grid" | "row";
}) {
  return (
    <div className={["ed-directory-stat-grid", layout === "row" ? "ed-directory-stat-grid--row" : null].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}

export type DirectorySortOption = {
  value: string;
  label: string;
};

export function DirectoryListToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search…",
  sortValue,
  onSortChange,
  sortOptions,
  sortLabel = "Sort",
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  sortValue: string;
  onSortChange: (value: string) => void;
  sortOptions: DirectorySortOption[];
  sortLabel?: string;
}) {
  return (
    <div className="ed-directory-list-toolbar">
      <label className="ed-directory-list-toolbar__search">
        <span className="ed-sr-only">{searchPlaceholder}</span>
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
      <label className="ed-directory-list-toolbar__sort">
        <span className="ed-directory-list-toolbar__sort-label">{sortLabel}</span>
        <select value={sortValue} onChange={(event) => onSortChange(event.target.value)}>
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export function DirectoryPagination({
  summary,
  onPrevious,
  onNext,
  disablePrevious,
  disableNext,
}: {
  summary: string;
  onPrevious?: () => void;
  onNext?: () => void;
  disablePrevious?: boolean;
  disableNext?: boolean;
}) {
  return (
    <div className="ed-directory-pagination">
      <p className="ed-directory-pagination__summary">{summary}</p>
      <div className="ed-directory-pagination__nav">
        <button type="button" className="ed-directory-pagination__btn" onClick={onPrevious} disabled={disablePrevious}>
          ‹
        </button>
        <button type="button" className="ed-directory-pagination__btn" onClick={onNext} disabled={disableNext}>
          ›
        </button>
      </div>
    </div>
  );
}

export function DirectoryStatCard({
  label,
  value,
  icon,
  iconTone = "blue",
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  iconTone?: DirectoryTone;
}) {
  return (
    <article className={`ed-directory-stat-card ed-directory-stat-card--${iconTone}`}>
      <span className="ed-directory-stat-card__icon" aria-hidden>
        {icon}
      </span>
      <p className="ed-directory-stat-card__value">{value}</p>
      <p className="ed-directory-stat-card__label">{label}</p>
    </article>
  );
}

export function DirectoryFab({
  label,
  onClick,
  href,
}: {
  label: string;
  onClick?: () => void;
  href?: string;
}) {
  const content = (
    <>
      <span aria-hidden>+</span>
      <span className="ed-sr-only">{label}</span>
    </>
  );

  if (href) {
    return (
      <Link to={href} className="ed-directory-fab" aria-label={label}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className="ed-directory-fab" aria-label={label} onClick={onClick}>
      {content}
    </button>
  );
}

export function DirectoryVisibility({
  mobile,
  desktop,
}: {
  mobile?: ReactNode;
  desktop?: ReactNode;
}) {
  return (
    <>
      {mobile ? <div className="ed-directory-only-mobile">{mobile}</div> : null}
      {desktop ? <div className="ed-directory-only-desktop">{desktop}</div> : null}
    </>
  );
}

export function DirectoryEmptyState({ message }: { message: string }) {
  return <p className="ed-directory-empty">{message}</p>;
}
