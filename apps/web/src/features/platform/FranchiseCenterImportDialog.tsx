import { useEffect, useRef, useState } from "react";
import { Button, MutationError } from "@edunudg/ui";
import {
  downloadFranchiseCenterImportTemplate,
  parseFranchiseCenterImportCsv,
  readImportCsvFile,
  toRpcRow,
  type FranchiseCenterImportPreview,
} from "@/lib/franchiseCenterImportHelpers";
import { importFranchiseCenters } from "@/lib/franchiseCenterImportApi";

type Props = {
  brandId: string;
  brandSlug: string;
  open: boolean;
  onClose: () => void;
  onImported: () => void;
};

function ImportPreviewTable({ preview }: { preview: FranchiseCenterImportPreview }) {
  if (preview.rows.length === 0) return null;

  return (
    <div className="ed-import-preview">
      <table className="ed-import-preview__table">
        <thead>
          <tr>
            <th scope="col">Row</th>
            <th scope="col">Slug</th>
            <th scope="col">Name</th>
            <th scope="col">City</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {preview.rows.map((row) => (
            <tr key={row.rowNumber} className={row.errors.length ? "ed-import-preview__row--error" : undefined}>
              <td>{row.rowNumber}</td>
              <td>{row.values.center_slug ?? ""}</td>
              <td>{row.values.name ?? ""}</td>
              <td>{row.values.city ?? ""}</td>
              <td>{row.errors.length ? row.errors.join(" ") : "Ready"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FranchiseCenterImportDialog({ brandId, brandSlug, open, onClose, onImported }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<FranchiseCenterImportPreview | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resultSummary, setResultSummary] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) {
      setPreview(null);
      setFileError(null);
      setSubmitError(null);
      setResultSummary(null);
      setSubmitting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [open]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleFileChange = async (file: File | null) => {
    setPreview(null);
    setFileError(null);
    setSubmitError(null);
    setResultSummary(null);

    if (!file) return;

    const { text, error } = await readImportCsvFile(file);
    if (error || !text) {
      setFileError(error ?? "Could not read file.");
      return;
    }

    const parsed = parseFranchiseCenterImportCsv(text);
    if (parsed.fileError) {
      setFileError(parsed.fileError);
      return;
    }

    setPreview(parsed);
  };

  const handleImport = async () => {
    if (!preview || preview.validRows.length === 0) return;

    setSubmitting(true);
    setSubmitError(null);
    setResultSummary(null);

    const { result, error } = await importFranchiseCenters(
      brandId,
      preview.validRows.map((row) => toRpcRow(row))
    );

    setSubmitting(false);

    if (error || !result) {
      setSubmitError(error ?? "Import failed.");
      return;
    }

    const createdCount = result.created.length;
    const errorCount = result.errors.length;
    setResultSummary(`Imported ${createdCount} center${createdCount === 1 ? "" : "s"}.${errorCount ? ` ${errorCount} row(s) failed on the server.` : ""}`);

    if (createdCount > 0) {
      onImported();
    }
  };

  const validCount = preview?.validRows.length ?? 0;
  const invalidCount = preview ? preview.rows.length - validCount : 0;

  return (
    <dialog
      ref={dialogRef}
      className="ed-import-dialog"
      onClose={handleClose}
      onClick={(e) => e.target === dialogRef.current && handleClose()}
    >
      <div className="ed-import-dialog__panel" role="document">
        <header className="ed-import-dialog__header">
          <div>
            <h2 id="franchise-import-title">Import franchise centers</h2>
            <p className="ed-text-sm ed-muted">
              Upload a CSV to create centers and center portal hostnames for {brandSlug}. Files are parsed locally; only
              validated rows are sent to the server.
            </p>
          </div>
          <button type="button" className="ed-import-dialog__close" aria-label="Close" onClick={handleClose}>
            ×
          </button>
        </header>

        <div className="ed-import-dialog__body">
          <div className="ed-import-dialog__actions">
            <Button type="button" variant="secondary" onClick={() => downloadFranchiseCenterImportTemplate(brandSlug)}>
              Download template
            </Button>
            <label className="ed-import-dialog__file-label">
              <span className="ed-btn ed-btn--secondary">Choose CSV file</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="ed-import-dialog__file-input"
                onChange={(e) => void handleFileChange(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <p className="ed-text-sm ed-muted">
            Required columns: center_slug, name, city. Optional: display_name, region, country, address, pincode,
            contact_phone, short_description, owner_email. Max 500 rows, 2 MB.
          </p>

          {fileError ? <MutationError message={fileError} /> : null}
          {submitError ? <MutationError message={submitError} /> : null}
          {resultSummary ? <p role="status">{resultSummary}</p> : null}

          {preview ? (
            <>
              <p className="ed-text-sm">
                {validCount} row{validCount === 1 ? "" : "s"} ready to import
                {invalidCount > 0 ? ` · ${invalidCount} row${invalidCount === 1 ? "" : "s"} with errors` : ""}
              </p>
              <ImportPreviewTable preview={preview} />
            </>
          ) : null}
        </div>

        <footer className="ed-import-dialog__footer">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleImport()} disabled={submitting || validCount === 0}>
            {submitting ? "Importing…" : `Import ${validCount || ""} center${validCount === 1 ? "" : "s"}`.trim()}
          </Button>
        </footer>
      </div>
    </dialog>
  );
}
