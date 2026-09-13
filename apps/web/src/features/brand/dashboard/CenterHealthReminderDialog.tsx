import { useEffect, useRef } from "react";
import { Button } from "@edunudg/ui";
import type { BrandDashboardHome } from "@/lib/brandDashboardHomeApi";
import { CenterHealthSummary } from "./CenterHealthSummary";
import "./brandDashboard.css";

type Props = {
  open: boolean;
  data: BrandDashboardHome;
  onClose: () => void;
};

export function CenterHealthReminderDialog({ open, data, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="ed-brand-dash__health-dialog"
      aria-labelledby="center-health-reminder-title"
      onClose={onClose}
      onClick={(event) => event.target === dialogRef.current && onClose()}
    >
      <div className="ed-brand-dash__health-dialog-panel" role="document">
        <header className="ed-brand-dash__health-dialog-header">
          <h2 id="center-health-reminder-title">Finish Center Health setup</h2>
          <button type="button" className="ed-brand-dash__health-dialog-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="ed-brand-dash__health-dialog-body">
          <p className="ed-brand-dash__health-dialog-intro">
            Complete the remaining checks so your brand setup reaches 100%.
          </p>
          <CenterHealthSummary data={data} onNavigate={onClose} />
        </div>
        <footer className="ed-brand-dash__health-dialog-footer">
          <Button onClick={onClose}>Got it</Button>
        </footer>
      </div>
    </dialog>
  );
}
