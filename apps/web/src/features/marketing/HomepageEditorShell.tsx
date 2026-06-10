import {
  createContext,
  useCallback,
  useContext,
  useId,
  useState,
  type ReactNode,
} from "react";
import { Button, FormGrid, SaveButton, Toggle } from "@edunudg/ui";

type ShellProps = {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  onSave?: () => void;
  savePending?: boolean;
  saved?: boolean;
  saveLabel?: string;
  children: ReactNode;
};

export type EditorSectionTone = "primary" | "secondary" | "tertiary" | "neutral" | "error";

export type EditorSectionMeta = {
  icon: string;
  tone: EditorSectionTone;
  description: string;
};

/** Icons, tones, and subtitles for homepage editor accordions (Novu + Abacus). */
export const HOMEPAGE_EDITOR_SECTION_META: Record<string, EditorSectionMeta> = {
  site: { icon: "web_asset", tone: "secondary", description: "General metadata & branding" },
  navigation: { icon: "navigation", tone: "tertiary", description: "Menus, links and footer" },
  hero: { icon: "auto_awesome", tone: "primary", description: "Main banner content & media" },
  featureScroll: { icon: "grid_view", tone: "secondary", description: "Responsive feature grid items" },
  highlights: { icon: "view_carousel", tone: "neutral", description: "Featured content carousels" },
  testimonials: { icon: "format_quote", tone: "error", description: "Student & partner success stories" },
  faq: { icon: "help", tone: "neutral", description: "Common questions and answers" },
  privacyFooter: { icon: "shield", tone: "neutral", description: "Legal disclosures and footer layout" },
  featureGrid: { icon: "grid_view", tone: "secondary", description: "Why us feature blocks" },
  founders: { icon: "groups", tone: "primary", description: "Leadership profiles" },
  trustMedia: { icon: "play_circle", tone: "primary", description: "Trust stats and video" },
  gallery: { icon: "photo_library", tone: "neutral", description: "Photo gallery images" },
  programsGrid: { icon: "school", tone: "primary", description: "Program cards and Know More details" },
  footerRich: { icon: "call_to_action", tone: "neutral", description: "Rich footer and contact info" },
};

function MaterialIcon({ name, filled }: { name: string; filled?: boolean }) {
  return (
    <span
      className="ed-ms-icon material-symbols-outlined"
      aria-hidden
      style={filled ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" } : undefined}
    >
      {name}
    </span>
  );
}

function EditorHeroSaveButton({
  onClick,
  pending,
  saved,
  label,
}: {
  onClick: () => void;
  pending?: boolean;
  saved?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      className="ed-editor-hero-card__save"
      onClick={onClick}
      disabled={pending}
    >
      <MaterialIcon name="save" filled />
      {pending ? "Saving…" : saved ? "Saved" : label}
    </button>
  );
}

/** Shared layout wrapper for platform and brand homepage editors. */
export function HomepageEditorShell({
  title,
  subtitle,
  actions,
  onSave,
  savePending,
  saved,
  saveLabel = "Save changes",
  children,
}: ShellProps) {
  const saveControl =
    actions ??
    (onSave ? (
      <EditorHeroSaveButton
        onClick={onSave}
        pending={savePending}
        saved={saved}
        label={saveLabel}
      />
    ) : null);

  return (
    <div
      className={[
        "ed-homepage-editor-shell",
        onSave ? "ed-homepage-editor-shell--has-save" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="ed-editor-hero-card">
        <div className="ed-editor-hero-card__glow" aria-hidden />
        <h2 className="ed-editor-hero-card__title">{title}</h2>
        {subtitle ? <p className="ed-editor-hero-card__subtitle">{subtitle}</p> : null}
        {saveControl}
      </div>
      {children}
      {onSave ? (
        <div
          className="ed-editor-save-bar ed-editor-save-bar--mobile"
          role="region"
          aria-label="Save changes"
        >
          <SaveButton onClick={onSave} pending={savePending} saved={saved} label={saveLabel} block />
        </div>
      ) : null}
    </div>
  );
}

type PanelProps = {
  title: string;
  description?: ReactNode;
  onSave: () => void;
  savePending?: boolean;
  saved?: boolean;
  saveLabel?: string;
  children: ReactNode;
};

/** One editable site (brand or center template) inside the marketing pages editor. */
export function HomepageEditorPanel({
  title,
  description,
  onSave,
  savePending,
  saved,
  saveLabel = "Save changes",
  children,
}: PanelProps) {
  return (
    <section className="ed-homepage-editor-panel">
      <div className="ed-editor-hero-card ed-editor-hero-card--panel">
        <h3 className="ed-editor-hero-card__title">{title}</h3>
        {description ? <p className="ed-editor-hero-card__subtitle">{description}</p> : null}
        <EditorHeroSaveButton
          onClick={onSave}
          pending={savePending}
          saved={saved}
          label={saveLabel}
        />
      </div>
      {children}
    </section>
  );
}

type AccordionGroupContextValue = {
  openId: string | null;
  setOpenId: (id: string | null) => void;
};

const AccordionGroupContext = createContext<AccordionGroupContextValue | null>(null);

/** Two-column field grid used inside homepage editor accordions (tablet+). */
export function EditorFieldsGrid({ children }: { children: ReactNode }) {
  return (
    <div className="ed-editable-form">
      <FormGrid columns={2}>{children}</FormGrid>
    </div>
  );
}

/** Span both columns inside {@link EditorFieldsGrid}. */
export function EditorFieldSpan({ children }: { children: ReactNode }) {
  return <div className="ed-form-grid__full">{children}</div>;
}

/** Muted helper copy above repeatable editor blocks. */
export function EditorSectionNote({ children }: { children: ReactNode }) {
  return <p className="ed-text-sm ed-muted ed-editor-section-note">{children}</p>;
}

type EditorItemPanelProps = {
  title: string;
  children: ReactNode;
  onRemove?: () => void;
  removeLabel?: string;
  className?: string;
};

/** Card panel for one repeatable homepage item (nav link, FAQ, program card, etc.). */
export function EditorItemPanel({
  title,
  children,
  onRemove,
  removeLabel = "Remove item",
  className,
}: EditorItemPanelProps) {
  return (
    <div className={["ed-editor-item-panel", className].filter(Boolean).join(" ")}>
      <h4 className="ed-editor-item-panel__title">{title}</h4>
      {children}
      {onRemove ? (
        <div className="ed-editor-item-panel__remove">
          <Button variant="danger" onClick={onRemove}>
            {removeLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

type EditorItemListProps = {
  children: ReactNode;
  onAdd: () => void;
  addLabel: string;
  className?: string;
};

/** Vertical stack of {@link EditorItemPanel} rows with a primary add action. */
export function EditorItemList({ children, onAdd, addLabel, className }: EditorItemListProps) {
  return (
    <div className={["ed-editor-item-list", className].filter(Boolean).join(" ")}>
      {children}
      <div className="ed-editor-item-list__add">
        <Button variant="primary" onClick={onAdd}>
          {addLabel}
        </Button>
      </div>
    </div>
  );
}

type EditorGroupedPanelProps = {
  title: string;
  note?: ReactNode;
  children: ReactNode;
  onAdd?: () => void;
  addLabel?: string;
  emptyLabel?: string;
  isEmpty?: boolean;
  actions?: ReactNode;
};

/** Dashed inset group (e.g. program benefits) with optional empty state and add action. */
export function EditorGroupedPanel({
  title,
  note,
  children,
  onAdd,
  addLabel,
  emptyLabel,
  isEmpty,
  actions,
}: EditorGroupedPanelProps) {
  return (
    <div className="ed-editor-grouped-panel">
      <p className="ed-editor-grouped-panel__head">{title}</p>
      {note ? <p className="ed-text-sm ed-muted ed-editor-grouped-panel__note">{note}</p> : null}
      {isEmpty && emptyLabel ? (
        <p className="ed-text-sm ed-muted ed-editor-grouped-panel__empty">{emptyLabel}</p>
      ) : null}
      {children}
      {actions ??
        (onAdd && addLabel ? (
          <div className="ed-editor-grouped-panel__actions">
            <Button variant="primary" onClick={onAdd}>
              {addLabel}
            </Button>
          </div>
        ) : null)}
    </div>
  );
}

type EditorSubItemProps = {
  children: ReactNode;
  onRemove: () => void;
  removeLabel?: string;
};

/** Nested item inside a grouped panel (e.g. one benefit bullet). */
export function EditorSubItem({ children, onRemove, removeLabel = "Remove" }: EditorSubItemProps) {
  return (
    <div className="ed-editor-sub-item">
      {children}
      <Button variant="danger" onClick={onRemove}>
        {removeLabel}
      </Button>
    </div>
  );
}

/** Single-open accordion list wrapper for homepage editor forms. */
export function HomepageEditorSections({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const value = { openId, setOpenId };
  return (
    <AccordionGroupContext.Provider value={value}>
      <div className="ed-homepage-editor">{children}</div>
    </AccordionGroupContext.Provider>
  );
}

type AccordionProps = {
  sectionId: string;
  title?: string;
  description?: string;
  icon?: string;
  iconTone?: EditorSectionTone;
  children: ReactNode;
  splitAside?: ReactNode;
  enabled?: boolean;
  onEnabledChange?: (enabled: boolean) => void;
};

/** Collapsed-by-default section; only one open at a time inside HomepageEditorSections. */
export function EditorAccordion({
  sectionId,
  title: titleOverride,
  description: descriptionOverride,
  icon: iconOverride,
  iconTone: toneOverride,
  children,
  splitAside,
  enabled = true,
  onEnabledChange,
}: AccordionProps) {
  const group = useContext(AccordionGroupContext);
  const bodyId = useId();
  const meta = HOMEPAGE_EDITOR_SECTION_META[sectionId];
  const title = titleOverride ?? sectionId;
  const description = descriptionOverride ?? meta?.description ?? "";
  const icon = iconOverride ?? meta?.icon ?? "tune";
  const tone = toneOverride ?? meta?.tone ?? "neutral";
  const isOpen = group?.openId === sectionId;
  const showToggle = onEnabledChange != null;

  const toggle = useCallback(() => {
    if (!group) return;
    group.setOpenId(isOpen ? null : sectionId);
  }, [group, isOpen, sectionId]);

  const toneClass = `ed-editor-accordion__icon--${tone}`;

  return (
    <section
      className={[
        "ed-editor-accordion",
        isOpen ? "ed-editor-accordion--open" : "",
        splitAside ? "ed-editor-accordion--split" : "",
        showToggle && !enabled ? "ed-editor-accordion--section-off" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {!isOpen ? (
        <button
          type="button"
          className="ed-editor-accordion__trigger"
          aria-expanded={false}
          aria-controls={bodyId}
          onClick={toggle}
        >
          <span className={["ed-editor-accordion__icon", toneClass].join(" ")}>
            <MaterialIcon name={icon} />
          </span>
          <span className="ed-editor-accordion__heading">
            <span className="ed-editor-accordion__title">{title}</span>
            {description ? (
              <span className="ed-editor-accordion__description">{description}</span>
            ) : null}
          </span>
          <MaterialIcon name="add" />
        </button>
      ) : (
        <>
          <div className="ed-editor-accordion__open-header">
            <div className="ed-editor-accordion__open-title">
              <span className={["ed-editor-accordion__icon", toneClass].join(" ")}>
                <MaterialIcon name={icon} filled />
              </span>
              <h3 className="ed-editor-accordion__title">{title}</h3>
            </div>
            <div className="ed-editor-accordion__open-actions">
              {showToggle ? (
                <label className="ed-editor-accordion__visibility-label">
                  <span className="ed-editor-accordion__visibility-text">Visible on site</span>
                  <Toggle
                    checked={enabled}
                    onChange={onEnabledChange}
                    aria-label={`${title} visible on site`}
                  />
                </label>
              ) : null}
              <button
                type="button"
                className="ed-editor-accordion__collapse"
                aria-expanded
                aria-controls={bodyId}
                aria-label={`Collapse ${title}`}
                onClick={toggle}
              >
                <MaterialIcon name="remove" />
              </button>
            </div>
          </div>
          <div id={bodyId} className="ed-editor-accordion__body">
            {splitAside ? (
              <div className="ed-editor-accordion__split">
                <div className="ed-editor-accordion__split-aside">{splitAside}</div>
                <div className="ed-editor-accordion__split-main">{children}</div>
              </div>
            ) : (
              children
            )}
          </div>
        </>
      )}
    </section>
  );
}
