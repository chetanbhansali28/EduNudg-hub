import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button, MutationError } from "@edunudg/ui";
import {
  downloadCenterStudentImportTemplate,
  parseCenterStudentImportCsv,
  readImportCsvFile,
  summarizeStudentImportResult,
  toStudentImportRpcRow,
  type CenterStudentImportPreview,
} from "@/lib/centerStudentImportHelpers";
import { importCenterStudents } from "@/lib/centerStudentImportApi";
import "@/features/platform/brandDetailPage.css";

type Props = {
  centerId: string;
  centerSlug: string;
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

function ImportPreviewTable({ preview }: { preview: CenterStudentImportPreview }) {
  if (preview.rows.length === 0) return null;

  return (
    <div className="ed-import-preview">
      <table className="ed-import-preview__table">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Student</th>
            <th scope="col">Parent</th>
            <th scope="col">WhatsApp</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {preview.rows.map((row) => (
            <tr key={row.rowNumber} className={row.errors.length ? "ed-import-preview__row--error" : undefined}>
              <td>{row.rowNumber}</td>
              <td>{row.values.student_name ?? ""}</td>
              <td>{row.values.parent_name ?? ""}</td>
              <td>{row.values.whatsapp ?? ""}</td>
              <td>{row.errors.length ? row.errors.join(" ") : "Ready"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CenterStudentImportDialog({ centerId, centerSlug, open, onClose, onImported }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<CenterStudentImportPreview | null>(null);
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

    const parsed = parseCenterStudentImportCsv(text);
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

    const { result, error } = await importCenterStudents(
      centerId,
      preview.validRows.map((row) => toStudentImportRpcRow(row))
    );

    setSubmitting(false);

    if (error || !result) {
      setSubmitError(error ?? "Import failed.");
      return;
    }

    const summary = summarizeStudentImportResult(result);
    const successCount = result.created.length + result.skipped.length;

    if (successCount > 0) {
      setResultSummary(summary);
      setImportSucceeded(true);
      if (result.created.length > 0) onImported();
      window.setTimeout(() => onClose(), 1500);
      return;
    }

    setResultSummary(summary || "Import failed.");
  };

  const validCount = preview?.validRows.length ?? 0;
  const invalidCount = preview ? preview.rows.length - validCount : 0;

  return (
    <dialog
      ref={dialogRef}
      className="ed-import-dialog"
      aria-labelledby="center-student-import-title"
      onClose={handleClose}
      onClick={(e) => e.target === dialogRef.current && handleClose()}
    >
      <div className="ed-import-dialog__panel" role="document">
        <header className="ed-import-dialog__header">
          <h2 id="center-student-import-title">Import students</h2>
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
                Bulk enroll existing students for <strong>{centerSlug}</strong>. Each row creates the student,
                parent, profile, and active enrollment. Student IDs are assigned automatically. CSV only · max 500
                rows · 2 MB.
              </p>

              <ol className="ed-import-steps" aria-label="Import steps">
                <ImportStep step={1} title="Download the format" hint="Template with headers and sample row.">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => downloadCenterStudentImportTemplate(centerSlug)}
                  >
                    Download template
                  </Button>
                </ImportStep>

                <ImportStep
                  step={2}
                  title="Add your data"
                  hint="Required: student_name, parent_name, whatsapp. Optional: email, student_dob, login_email, school_name, address_line1, city, state, pincode, program_name, starting_level. Student ID is assigned automatically; profile phone uses WhatsApp."
                />

                <ImportStep
                  step={3}
                  title="Upload student data"
                  hint={uploadedFileName ? `Selected: ${uploadedFileName}` : "Save as .csv, then upload."}
                >
                  <label className="ed-import-dialog__file-label">
                    <span className="ed-btn ed-btn--secondary">Upload CSV</span>
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
                    hint={`${validCount} ready${invalidCount > 0 ? ` · ${invalidCount} with errors` : ""}. Duplicates at this center are skipped.`}
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
                {submitting ? "Importing…" : `Import ${validCount} student${validCount === 1 ? "" : "s"}`}
              </Button>
            ) : null}
          </footer>
        ) : null}
      </div>
    </dialog>
  );
}
