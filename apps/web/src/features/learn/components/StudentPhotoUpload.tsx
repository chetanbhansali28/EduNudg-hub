import { useEffect, useId, useState } from "react";
import { uploadStudentPhoto } from "@/lib/studentPhotoStorage";

const ACCEPT = "image/png,image/jpeg,image/webp,image/gif";

type Props = {
  brandId: string;
  studentId: string;
  currentPhotoUrl?: string | null;
  onUploaded: (url: string) => void;
  disabled?: boolean;
  required?: boolean;
  compact?: boolean;
  /** Avatar + pick control only — no field label (profile identity row). */
  inline?: boolean;
};

export function StudentPhotoUpload({
  brandId,
  studentId,
  currentPhotoUrl,
  onUploaded,
  disabled,
  required,
  compact,
  inline,
}: Props) {
  const inputId = useId();
  const [preview, setPreview] = useState(currentPhotoUrl?.trim() || "");
  const [pending, setPending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setPreview(currentPhotoUrl?.trim() || "");
  }, [currentPhotoUrl]);

  const handleChange = async (file: File | undefined) => {
    if (!file) return;
    setLocalError(null);
    setPending(true);
    try {
      const url = await uploadStudentPhoto(brandId, studentId, file);
      setPreview(url);
      onUploaded(url);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Photo upload failed");
    } finally {
      setPending(false);
    }
  };

  if (inline) {
    return (
      <div className="ed-sp-photo-inline">
        <label className="ed-sp-photo-inline__control" htmlFor={inputId}>
          {preview ? (
            <img src={preview} alt="" className="ed-sp-photo-preview ed-sp-photo-preview--inline" width={56} height={56} />
          ) : (
            <span className="ed-sp-photo-preview ed-sp-photo-preview--empty ed-sp-photo-preview--inline" aria-hidden>
              {pending ? "…" : "Photo"}
            </span>
          )}
          <span className="ed-sp-photo-inline__hint">{pending ? "Uploading" : "Change"}</span>
          <input
            id={inputId}
            name="student-photo"
            className="ed-sp-photo-upload__input"
            type="file"
            accept={ACCEPT}
            disabled={disabled || pending}
            onChange={(e) => void handleChange(e.target.files?.[0])}
          />
        </label>
        {required && !preview ? (
          <span className="ed-sp-photo-inline__required" aria-hidden>
            *
          </span>
        ) : null}
        {localError ? (
          <p className="ed-sp-photo-inline__error" role="alert">
            {localError}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`ed-field ed-sp-photo-upload${compact ? " ed-sp-photo-upload--compact" : ""}`}>
      <label className="ed-field__label" htmlFor={inputId}>
        Photo{required ? " *" : ""}
      </label>
      {!compact ? (
        <p className="ed-text-sm ed-muted">Upload from your device. A new photo replaces the previous one.</p>
      ) : null}
      <div className="ed-sp-photo-upload__row">
        {preview ? (
          <img src={preview} alt="" className="ed-sp-photo-preview" width={72} height={72} />
        ) : (
          <div className="ed-sp-photo-preview ed-sp-photo-preview--empty" aria-hidden>
            {compact ? "Add" : "No photo"}
          </div>
        )}
        <label className="ed-sp-photo-upload__pick">
          <span className="ed-sp-photo-upload__pick-label">{pending ? "Uploading…" : "Choose photo"}</span>
          <input
            id={inputId}
            name="student-photo"
            className="ed-sp-photo-upload__input"
            type="file"
            accept={ACCEPT}
            disabled={disabled || pending}
            onChange={(e) => void handleChange(e.target.files?.[0])}
          />
        </label>
      </div>
      {localError ? (
        <p className="ed-text-sm" role="alert">
          {localError}
        </p>
      ) : null}
    </div>
  );
}
