import { useEffect, useRef, useState, type ReactNode } from "react";
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

function ImportStep({
  step,
  title,
  hint,
  children,
}: {
  step: number;
  title: string;
  hint?: string;
  children?: ReactNode;
}) {
  return (
    <li className="ed-import-step">
      <span className="ed-import-step__badge" aria-hidden="true">
        {step}
      </span>
      <div className="ed-import-step__body">
        <div className="ed-import-step__copy">
          <span className="ed-import-step__title">{title}</span>
          {hint ? <span className="ed-import-step__hint">{hint}</span> : null}
        </div>
        {children ? <div className="ed-import-step__action">{children}</div> : null}
      </div>
    </li>
  );
}

function ImportPreviewTable({ preview }: { preview: FranchiseCenterImportPreview }) {
  if (preview.rows.length === 0) return null;

  return (
    <div className="ed-import-preview">
      <table className="ed-import-preview__table">
        <thead>
          <tr>
            <th scope="col">#</th>
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
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resultSummary, setResultSummary] = useState<string | null>(null);
  const [importSucceeded, setImportSucceeded] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) {
      setPreview(null);
      setUploadedFileName(null);
      setFileError(null);
      setSubmitError(null);
      setResultSummary(null);
      setImportSucceeded(false);
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
    setUploadedFileName(null);
    setFileError(null);
    setSubmitError(null);
    setResultSummary(null);

    if (!file) return;

    setUploadedFileName(file.name);

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
    setImportSucceeded(false);

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

    if (createdCount > 0) {
      const summary =
        errorCount > 0
          ? `Imported ${createdCount} center${createdCount === 1 ? "" : "s"}. ${errorCount} row${errorCount === 1 ? "" : "s"} failed.`
          : `Imported ${createdCount} franchise center${createdCount === 1 ? "" : "s"}.`;
      setResultSummary(summary);
      setImportSucceeded(true);
      onImported();
      window.setTimeout(() => onClose(), 1500);
      return;
    }

    setResultSummary(errorCount ? `${errorCount} row${errorCount === 1 ? "" : "s"} failed on the server.` : "Import failed.");
  };

  const validCount = preview?.validRows.length ?? 0;
  const invalidCount = preview ? preview.rows.length - validCount : 0;

  return (
    <dialog
      ref={dialogRef}
      className="ed-import-dialog"
      aria-labelledby="franchise-import-title"
      onClose={handleClose}
      onClick={(e) => e.target === dialogRef.current && handleClose()}
    >
      <div className="ed-import-dialog__panel" role="document">
        <header className="ed-import-dialog__header">
          <h2 id="franchise-import-title">Import franchise centers</h2>
          <button type="button" className="ed-import-dialog__close" aria-label="Close" onClick={handleClose}>
            ×
          </button>
        </header>

        <div className="ed-import-dialog__body">
          {importSucceeded ? (
            <p className="ed-import-dialog__success" role="status">
              {resultSummary}
            </p>
          ) : (
            <>
              <p className="ed-import-dialog__intro">
                Bulk onboard centers for <strong>{brandSlug}</strong>. CSV only · max 500 rows · 2 MB.
              </p>

              <ol className="ed-import-steps" aria-label="Import steps">
                <ImportStep step={1} title="Download the format" hint="Template with headers and sample row.">
                  <Button type="button" variant="secondary" onClick={() => downloadFranchiseCenterImportTemplate(brandSlug)}>
                    Download template
                  </Button>
                </ImportStep>

                <ImportStep
                  step={2}
                  title="Add your data"
                  hint="Required: center_slug, name, city. Optional: display_name, region, country, address, pincode, contact_phone, short_description, owner_email."
                />

                <ImportStep step={3} title="Upload franchise data" hint={uploadedFileName ? `Selected: ${uploadedFileName}` : "Save as .csv, then upload."}>
                  <label className="ed-import-dialog__file-label">
                    <span className="ed-btn ed-btn--secondary">Upload Franchise Data</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,text/csv"
                      className="ed-import-dialog__file-input"
                      onChange={(e) => void handleFileChange(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </ImportStep>

                {preview ? (
                  <ImportStep
                    step={4}
                    title="Review and import"
                    hint={`${validCount} ready${invalidCount > 0 ? ` · ${invalidCount} with errors` : ""}`}
                  />
                ) : null}
              </ol>

              {fileError ? <MutationError message={fileError} /> : null}
              {preview ? (
                <>
                  <ImportPreviewTable preview={preview} />
                  {submitError ? <MutationError message={submitError} /> : null}
                  {resultSummary && !importSucceeded ? (
                    <p className="ed-import-dialog__note" role="status">
                      {resultSummary}
                    </p>
                  ) : null}
                </>
              ) : null}
            </>
          )}
        </div>

        {!importSucceeded ? (
          <footer className="ed-import-dialog__footer">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            {preview ? (
              <Button type="button" onClick={() => void handleImport()} disabled={submitting || validCount === 0}>
                {submitting ? "Importing…" : `Import ${validCount} center${validCount === 1 ? "" : "s"}`}
              </Button>
            ) : null}
          </footer>
        ) : null}
      </div>
    </dialog>
  );
}
