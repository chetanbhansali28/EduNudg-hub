import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { scrollMarketingEditorToBottom } from "@/lib/marketingRequiredPhotos";
import type { MarketingTheme } from "@/types/homepage";
import "./unsaved-marketing-dialog.css";

type DialogProps = {
  open: boolean;
  savePending?: boolean;
  marketingTheme?: MarketingTheme;
  onStay: () => void;
  onSave: () => void;
};

export function UnsavedMarketingChangesDialog({
  open,
  savePending = false,
  marketingTheme = "novu",
  onStay,
  onSave,
}: DialogProps) {
  const titleId = useId();
  const descId = useId();
  const themeClass =
    marketingTheme === "spark-academy" ||
    marketingTheme === "edu-learn" ||
    marketingTheme === "abacus-classic"
      ? `ed-unsaved-changes--${marketingTheme}`
      : "ed-unsaved-changes--novu";

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onStay();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onStay]);

  if (!open) return null;

  return createPortal(
    <div className="ed-unsaved-changes-backdrop" onClick={onStay}>
      <div
        className={`ed-unsaved-changes ${themeClass}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="ed-unsaved-changes__title">
          Save your changes?
        </h2>
        <p id={descId} className="ed-unsaved-changes__description">
          You have unsaved homepage or center-site edits. Save before leaving, or stay on this page to
          finish. The save bar is at the bottom of the page.
        </p>
        <div className="ed-unsaved-changes__actions">
          <button
            type="button"
            className="ed-unsaved-changes__btn ed-unsaved-changes__btn--cancel"
            onClick={onStay}
            disabled={savePending}
          >
            Cancel
          </button>
          <button
            type="button"
            className="ed-unsaved-changes__btn ed-unsaved-changes__btn--ok"
            onClick={onSave}
            disabled={savePending}
          >
            {savePending ? "Saving…" : "OK"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/** BrowserRouter (not a data router) cannot use useBlocker — resolve in-app Link hrefs instead. */
export function resolveInternalAppPath(href: string, origin = window.location.origin): string | null {
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("mailto:") || trimmed.startsWith("tel:")) {
    return null;
  }
  try {
    const url = new URL(trimmed, origin);
    if (url.origin !== origin) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

function currentAppPath(): string {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function useUnsavedMarketingNavigation(options: {
  isDirty: boolean;
  savePending?: boolean;
  marketingTheme?: MarketingTheme;
  onSave: () => Promise<boolean>;
}) {
  const navigate = useNavigate();
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const openGuard = useCallback((path: string) => {
    setPendingPath(path);
    scrollMarketingEditorToBottom();
  }, []);

  useEffect(() => {
    if (!options.isDirty) {
      setPendingPath(null);
      return;
    }

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      const next = resolveInternalAppPath(anchor.getAttribute("href") ?? "");
      if (!next || next === currentAppPath()) return;
      event.preventDefault();
      event.stopPropagation();
      openGuard(next);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [options.isDirty, openGuard]);

  useEffect(() => {
    if (!options.isDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [options.isDirty]);

  const stay = useCallback(() => {
    setPendingPath(null);
  }, []);

  const leaveToPending = useCallback(() => {
    const path = pendingPath;
    setPendingPath(null);
    if (path) navigate(path);
  }, [navigate, pendingPath]);

  const save = useCallback(async () => {
    const ok = await optionsRef.current.onSave();
    if (ok) {
      leaveToPending();
      return;
    }
    setPendingPath(null);
  }, [leaveToPending]);

  return {
    dialog: (
      <UnsavedMarketingChangesDialog
        open={pendingPath != null}
        savePending={options.savePending}
        marketingTheme={options.marketingTheme}
        onStay={stay}
        onSave={() => void save()}
      />
    ),
  };
}
