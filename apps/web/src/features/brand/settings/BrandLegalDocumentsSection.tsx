import { useId, useRef, useState } from "react";
import { Button } from "@edunudg/ui";
import { uploadBrandLegalDocument } from "@/lib/brandLegalStorage";
import {
  LEGAL_UPLOAD_ACCEPT,
  LEGAL_UPLOAD_MAX_BYTES,
  type LegalDocument,
} from "@/features/brand/settings/brandSettingsHelpers";

type Props = {
  brandId: string | null;
  documents: LegalDocument[];
  onDocumentsChange: (next: LegalDocument[]) => void;
  onPersist: () => void;
  persistPending?: boolean;
  persistSaved?: boolean;
  showDesktopSave?: boolean;
};

const ICON_DOC = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
    <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
    <path d="M14 2v5h5" />
  </svg>
);

const ICON_FOLDER = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
    <path d="M3 7h6l2 2h10v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
  </svg>
);

export function BrandLegalDocumentsSection({
  brandId,
  documents,
  onDocumentsChange,
  onPersist,
  persistPending,
  persistSaved,
  showDesktopSave = true,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length || !brandId) return;
    setError(null);
    setPending(true);
    try {
      const uploaded: LegalDocument[] = [];
      for (const file of Array.from(files)) {
        if (file.size > LEGAL_UPLOAD_MAX_BYTES) {
          throw new Error(`${file.name} exceeds the 10MB limit.`);
        }
        uploaded.push(await uploadBrandLegalDocument(brandId, file));
      }
      onDocumentsChange([...uploaded, ...documents]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setPending(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <section className="ed-brand-settings-card ed-brand-settings-page__card--wide">
      <div className="ed-brand-settings-card__mobile-label">{ICON_DOC} Legal &amp; Documentation</div>
      <header className="ed-brand-settings-card__head">
        <div>
          <h2 className="ed-brand-settings-card__title">Legal &amp; Documentation</h2>
          <p className="ed-brand-settings-card__subtitle">
            Manage your legal agreements and platform documentation.
          </p>
        </div>
        <span className="ed-brand-settings-card__head-icon ed-brand-settings-card__head-icon--corner">{ICON_DOC}</span>
      </header>

      <div className="ed-brand-settings-legal-grid">
        <div>
          <p className="ed-brand-settings-legal-current__title">Upload Legal Documents</p>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={LEGAL_UPLOAD_ACCEPT}
            multiple
            className="sr-only"
            disabled={!brandId || pending}
            onChange={(e) => void handleFiles(e.target.files)}
          />
          <div className="ed-brand-settings-legal-upload">
            <span className="ed-brand-settings-legal-upload__icon">{ICON_DOC}</span>
            <button
              type="button"
              className="ed-brand-settings-logo-btn"
              disabled={!brandId || pending}
              onClick={() => inputRef.current?.click()}
            >
              {pending ? "Uploading…" : "Choose Files"}
            </button>
            <p className="ed-brand-settings-legal-upload__copy">Upload Privacy Policy, TOS, etc.</p>
            <p className="ed-brand-settings-legal-upload__copy">Upload PDF, DOCX or JPG (Max 10MB)</p>
          </div>
        </div>

        <div className="ed-brand-settings-legal-current">
          <p className="ed-brand-settings-legal-current__title">Current Documents</p>
          {documents.length === 0 ? (
            <div className="ed-brand-settings-legal-empty">
              {ICON_FOLDER}
              <span>No files uploaded yet</span>
            </div>
          ) : (
            <ul className="ed-brand-settings-legal-list">
              {documents.map((doc) => (
                <li key={`${doc.url}-${doc.name}`}>
                  <a href={doc.url} target="_blank" rel="noreferrer">
                    {doc.name}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {error ? (
        <p className="ed-text-sm" role="alert">
          {error}
        </p>
      ) : null}

      {showDesktopSave ? (
        <footer className="ed-brand-settings-card__footer ed-brand-settings-card__footer--end ed-brand-settings-card__footer--desktop-only">
          <Button onClick={onPersist} disabled={persistPending}>
            {persistPending ? "Saving…" : persistSaved ? "Saved" : "Save Documents"}
          </Button>
        </footer>
      ) : null}
    </section>
  );
}
