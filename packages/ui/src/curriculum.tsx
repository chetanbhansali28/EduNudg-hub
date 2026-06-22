import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export type CurriculumCourseStatus = "active" | "draft" | "archived";

export function CurriculumStatusBadge({
  status,
  children,
}: {
  status: CurriculumCourseStatus;
  children?: ReactNode;
}) {
  const label =
    children ??
    (status === "active" ? "ACTIVE" : status === "draft" ? "DRAFT" : "ARCHIVED");
  return <span className={`ed-curriculum-status ed-curriculum-status--${status}`}>{label}</span>;
}

export function CourseAvatar({
  initials,
  tone = "blue",
}: {
  initials: string;
  tone?: "blue" | "purple" | "teal" | "pink";
}) {
  return (
    <span className={`ed-curriculum-avatar ed-curriculum-avatar--${tone}`} aria-hidden>
      {initials}
    </span>
  );
}

export function CurriculumSearchField({
  value,
  onChange,
  placeholder = "Search courses or programs…",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="ed-curriculum-search">
      <span className="ed-curriculum-search__icon" aria-hidden>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </span>
      <input
        type="search"
        className="ed-curriculum-search__input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function CurriculumFilterTabs<T extends string>({
  options,
  value,
  onChange,
  "aria-label": ariaLabel = "Course filter",
}: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  "aria-label"?: string;
}) {
  return (
    <div className="ed-curriculum-filter-tabs" role="tablist" aria-label={ariaLabel}>
      {options.map((opt) => {
        const active = opt.value === value;
        const label = opt.count != null ? `${opt.label} (${opt.count})` : opt.label;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={`ed-curriculum-filter-tabs__btn${active ? " is-active" : ""}`}
            onClick={() => onChange(opt.value)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function CourseListItem({
  initials,
  tone = "blue",
  title,
  meta,
  excerpt,
  selected,
  status,
  onSelect,
}: {
  initials: string;
  tone?: "blue" | "purple" | "teal" | "pink";
  title: string;
  meta?: string;
  excerpt?: string;
  selected?: boolean;
  status?: CurriculumCourseStatus;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`ed-curriculum-course-item${selected ? " is-selected" : ""}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <CourseAvatar initials={initials} tone={tone} />
      <div className="ed-curriculum-course-item__copy">
        <div className="ed-curriculum-course-item__head">
          <p className="ed-curriculum-course-item__title">{title}</p>
          {status ? <CurriculumStatusBadge status={status} /> : null}
        </div>
        {meta ? <p className="ed-curriculum-course-item__meta">{meta}</p> : null}
        {excerpt ? <p className="ed-curriculum-course-item__excerpt">{excerpt}</p> : null}
      </div>
    </button>
  );
}

export function CurriculumBuilderHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  variant = "page",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  variant?: "page" | "detail";
}) {
  return (
    <header className={`ed-curriculum-builder-header ed-curriculum-builder-header--${variant}`}>
      <div className="ed-curriculum-builder-header__copy">
        {eyebrow ? <p className="ed-curriculum-builder-header__eyebrow">{eyebrow}</p> : null}
        <h1 className="ed-curriculum-builder-header__title">{title}</h1>
        {subtitle ? <p className="ed-curriculum-builder-header__subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="ed-curriculum-builder-header__actions">{actions}</div> : null}
    </header>
  );
}

export function CurriculumSidebarCard({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <aside className="ed-curriculum-sidebar-card">
      <div className="ed-curriculum-sidebar-card__head">
        <h2 className="ed-curriculum-sidebar-card__title">{title}</h2>
        {actions ? <div className="ed-curriculum-sidebar-card__actions">{actions}</div> : null}
      </div>
      <div className="ed-curriculum-sidebar-card__body">{children}</div>
    </aside>
  );
}

export function CurriculumGeneralInfoCard({
  hero,
  children,
  stats,
}: {
  hero: ReactNode;
  children: ReactNode;
  stats?: ReactNode;
}) {
  return (
    <section className="ed-curriculum-section ed-curriculum-general-info">
      <div className="ed-curriculum-general-info__hero">{hero}</div>
      <div className="ed-curriculum-general-info__body">{children}</div>
      {stats ? <div className="ed-curriculum-general-info__stats">{stats}</div> : null}
    </section>
  );
}

export function CurriculumMediaIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="m16 13 5-5-5-5" />
      <rect x="2" y="7" width="12" height="10" rx="2" />
    </svg>
  );
}

export function CurriculumProgramOutlineRow({
  title,
  subtitle,
  onSelect,
  selected,
}: {
  title: string;
  subtitle?: string;
  onSelect?: () => void;
  selected?: boolean;
}) {
  const className = [
    "ed-curriculum-program-outline",
    selected ? "is-selected" : "",
    onSelect ? "is-clickable" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <span className="ed-curriculum-program-outline__dot" aria-hidden />
      <span className="ed-curriculum-program-outline__copy">
        <span className="ed-curriculum-program-outline__title">{title}</span>
        {subtitle ? <span className="ed-curriculum-program-outline__subtitle">{subtitle}</span> : null}
      </span>
    </>
  );

  if (onSelect) {
    return (
      <button type="button" className={className} onClick={onSelect} aria-pressed={selected}>
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}

export function CurriculumSectionCard({
  icon,
  title,
  actions,
  children,
  className,
}: {
  icon?: ReactNode;
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={["ed-curriculum-section", className].filter(Boolean).join(" ")}>
      <div className="ed-curriculum-section__head">
        <div className="ed-curriculum-section__title-row">
          {icon ? <span className="ed-curriculum-section__icon">{icon}</span> : null}
          <h2 className="ed-curriculum-section__title">{title}</h2>
        </div>
        {actions ? <div className="ed-curriculum-section__actions">{actions}</div> : null}
      </div>
      <div className="ed-curriculum-section__body">{children}</div>
    </section>
  );
}

export function CurriculumStatChip({ children }: { children: ReactNode }) {
  return <span className="ed-curriculum-stat-chip">{children}</span>;
}

export function CurriculumProgramRow({
  title,
  code,
  onEdit,
}: {
  title: string;
  code?: string;
  onEdit?: () => void;
}) {
  return (
    <div className="ed-curriculum-program-row">
      <div className="ed-curriculum-program-row__copy">
        <span className="ed-curriculum-program-row__icon" aria-hidden>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
          </svg>
        </span>
        <span className="ed-curriculum-program-row__title">
          {title}
          {code ? <span className="ed-curriculum-program-row__code"> ({code})</span> : null}
        </span>
      </div>
      {onEdit ? (
        <button type="button" className="ed-curriculum-program-row__edit" onClick={onEdit}>
          Edit
        </button>
      ) : null}
    </div>
  );
}

export function CurriculumAddProgramButton({ onClick, label = "+ Add Program" }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" className="ed-curriculum-add-program" onClick={onClick}>
      {label}
    </button>
  );
}

export function CurriculumTipCard({
  title = "Curriculum Tip",
  body,
}: {
  title?: string;
  body: string;
}) {
  return (
    <aside className="ed-curriculum-tip-card">
      <span className="ed-curriculum-tip-card__icon" aria-hidden>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18h6" />
          <path d="M10 22h4" />
          <path d="M12 2a7 7 0 0 0-4 12.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3A7 7 0 0 0 12 2z" />
        </svg>
      </span>
      <div>
        <p className="ed-curriculum-tip-card__title">{title}</p>
        <p className="ed-curriculum-tip-card__body">{body}</p>
      </div>
    </aside>
  );
}

export function CurriculumMobileCourseCard({
  initials,
  tone = "blue",
  title,
  meta,
  excerpt,
  status,
  programs,
  onAddProgram,
  onContinueSetup,
  onEditProgram,
  readOnly,
}: {
  initials: string;
  tone?: "blue" | "purple" | "teal" | "pink";
  title: string;
  meta?: string;
  excerpt?: string;
  status: CurriculumCourseStatus;
  programs: { id: string; title: string; code?: string }[];
  onAddProgram?: () => void;
  onContinueSetup?: () => void;
  onEditProgram?: (id: string) => void;
  readOnly?: boolean;
}) {
  const isDraft = status === "draft";

  return (
    <article className={`ed-curriculum-mobile-card${isDraft ? " is-draft" : ""}`}>
      <div className="ed-curriculum-mobile-card__head">
        <CourseAvatar initials={initials} tone={tone} />
        <div className="ed-curriculum-mobile-card__copy">
          <p className="ed-curriculum-mobile-card__title">{title}</p>
          {meta ? <p className="ed-curriculum-mobile-card__meta">{meta}</p> : null}
        </div>
        <CurriculumStatusBadge status={status} />
      </div>
      {excerpt ? <p className="ed-curriculum-mobile-card__excerpt">{excerpt}</p> : null}

      {isDraft ? (
        onContinueSetup ? (
          <button type="button" className="ed-curriculum-mobile-card__continue" onClick={onContinueSetup}>
            Continue Setup
          </button>
        ) : null
      ) : (
        <>
          {programs.length > 0 ? (
            <div className="ed-curriculum-mobile-card__programs">
              {programs.map((program) => (
                <CurriculumProgramRow
                  key={program.id}
                  title={program.title}
                  code={program.code}
                  onEdit={onEditProgram && !readOnly ? () => onEditProgram(program.id) : undefined}
                />
              ))}
            </div>
          ) : null}
          {!readOnly && onAddProgram ? (
            <CurriculumAddProgramButton onClick={onAddProgram} />
          ) : null}
        </>
      )}
    </article>
  );
}

export function CurriculumFab({ onClick, label = "Add course" }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" className="ed-curriculum-fab" onClick={onClick} aria-label={label}>
      +
    </button>
  );
}

export function CurriculumCourseEditorHero({
  initials,
  tone = "blue",
  title,
  status,
  description,
  saveAction,
  embedded = false,
}: {
  initials: string;
  tone?: "blue" | "purple" | "teal" | "pink";
  title: string;
  status: CurriculumCourseStatus;
  description?: string;
  saveAction?: ReactNode;
  embedded?: boolean;
}) {
  return (
    <div className={`ed-curriculum-editor-hero${embedded ? " ed-curriculum-editor-hero--embedded" : ""}`}>
      <div className="ed-curriculum-editor-hero__main">
        <CourseAvatar initials={initials} tone={tone} />
        <div>
          <div className="ed-curriculum-editor-hero__title-row">
            <h2 className="ed-curriculum-editor-hero__title">{title}</h2>
            <CurriculumStatusBadge status={status} />
          </div>
          {description ? <p className="ed-curriculum-editor-hero__description">{description}</p> : null}
        </div>
      </div>
      {saveAction ? <div className="ed-curriculum-editor-hero__actions">{saveAction}</div> : null}
    </div>
  );
}

export function CurriculumVideoPreview({
  url,
  onEdit,
  onDelete,
}: {
  url?: string | null;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  if (!url) {
    return (
      <div className="ed-curriculum-video-preview ed-curriculum-video-preview--empty">
        <span>No preview video yet</span>
      </div>
    );
  }

  return (
    <div className="ed-curriculum-video-preview">
      <video src={url} controls muted playsInline className="ed-curriculum-video-preview__media" />
      <div className="ed-curriculum-video-preview__overlay">
        {onEdit ? (
          <button type="button" className="ed-curriculum-video-preview__action" onClick={onEdit} aria-label="Edit video">
            ✎
          </button>
        ) : null}
        {onDelete ? (
          <button type="button" className="ed-curriculum-video-preview__action" onClick={onDelete} aria-label="Delete video">
            🗑
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function CurriculumBannerDropzone({
  imageUrl,
  onUploadClick,
  uploading,
}: {
  imageUrl?: string | null;
  onUploadClick: () => void;
  uploading?: boolean;
}) {
  return (
    <button type="button" className="ed-curriculum-banner-dropzone" onClick={onUploadClick} disabled={uploading}>
      {imageUrl ? (
        <img src={imageUrl} alt="" className="ed-curriculum-banner-dropzone__image" />
      ) : (
        <>
          <span className="ed-curriculum-banner-dropzone__icon" aria-hidden>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <path d="M17 8l-5-5-5 5" />
              <path d="M12 3v12" />
            </svg>
          </span>
          <span className="ed-curriculum-banner-dropzone__label">
            {uploading ? "Uploading…" : "Drop image here or click to upload"}
          </span>
        </>
      )}
    </button>
  );
}

export function CurriculumViewAllLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="ed-curriculum-view-all">
      {children}
    </Link>
  );
}
