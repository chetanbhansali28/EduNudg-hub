import { useId, useRef, useState } from "react";
import { Button } from "@edunudg/ui";
import { uploadBrandLegalPage } from "@/lib/brandLegalStorage";
import {
  BRAND_LEGAL_PAGE_LABELS,
  BRAND_LEGAL_UPLOAD_ACCEPT,
  BRAND_LEGAL_UPLOAD_MAX_BYTES,
  type BrandLegalPageDocument,
  type BrandLegalPageKind,
} from "@/lib/brandLegalPages";

type Props = {
  brandId: string | null;
  kind: BrandLegalPageKind;
  document?: BrandLegalPageDocument;
  onUploaded: (doc: BrandLegalPageDocument | undefined) => void;
  compact?: boolean;
};

export function BrandLegalSlotUpload({ brandId, kind, document, onUploaded, compact }: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file || !brandId) return;
    setError(null);
    if (file.size > BRAND_LEGAL_UPLOAD_MAX_BYTES) {
      setError(`${file.name} exceeds the 10MB limit.`);
      return;
    }
    const lower = file.name.toLowerCase();
    if (lower.endsWith(".doc") && !lower.endsWith(".docx")) {
      setError("Legacy .doc files are not supported. Save as .docx or PDF and upload again.");
      return;
    }
    setPending(true);
    try {
      const uploaded = await uploadBrandLegalPage(brandId, kind, file);
      onUploaded(uploaded);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      if (/mime type/i.test(message) && /not supported/i.test(message)) {
        setError(
          "This file type is not enabled in storage yet. Ask your admin to apply the latest database migration (063_brand_assets_legal_mime_types), then try again."
        );
      } else {
        setError(message);
      }
    } finally {
      setPending(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={compact ? "ed-brand-settings-legal-slot ed-brand-settings-legal-slot--compact" : "ed-brand-settings-legal-slot"}>
      <p className="ed-brand-settings-legal-current__title">{BRAND_LEGAL_PAGE_LABELS[kind]}</p>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={BRAND_LEGAL_UPLOAD_ACCEPT}
        className="sr-only"
        disabled={!brandId || pending}
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
      {document ? (
        <div className="ed-brand-settings-legal-slot__current">
          <a href={document.fileUrl} target="_blank" rel="noreferrer">
            {document.fileName}
          </a>
          <p className="ed-text-sm ed-muted">
            Public page: /legal/{kind}
            {document.htmlUrl ? " · Word converted to HTML" : document.fileName.toLowerCase().endsWith(".pdf") ? " · PDF viewer" : ""}
            {" · "}Updated {new Date(document.uploadedAt).toLocaleDateString()}
          </p>
          <div className="ed-brand-settings-legal-slot__actions">
            <Button type="button" variant="secondary" disabled={!brandId || pending} onClick={() => inputRef.current?.click()}>
              {pending ? "Uploading…" : "Replace"}
            </Button>
            <Button type="button" variant="ghost" disabled={pending} onClick={() => onUploaded(undefined)}>
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className="ed-brand-settings-legal-upload">
          <button
            type="button"
            className="ed-brand-settings-logo-btn"
            disabled={!brandId || pending}
            onClick={() => inputRef.current?.click()}
          >
            {pending ? "Uploading…" : "Upload document"}
          </button>
          <p className="ed-brand-settings-legal-upload__copy">PDF or Word (.docx) — max 10MB. Footer link appears after you save.</p>
        </div>
      )}
      {error ? (
        <p className="ed-text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
