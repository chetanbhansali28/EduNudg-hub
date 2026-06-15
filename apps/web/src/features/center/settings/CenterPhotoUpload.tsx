import { useEffect, useId, useRef, useState } from "react";
import { uploadCenterPhoto } from "@/lib/centerPhotoStorage";

const ACCEPT = "image/png,image/jpeg,image/webp,image/gif";

type Props = {
  brandId: string;
  centerId: string;
  currentPhotoUrl?: string | null;
  onUploaded: (url: string) => void;
  disabled?: boolean;
  variant?: "desktop" | "mobile";
};

export function CenterPhotoUpload({
  brandId,
  centerId,
  currentPhotoUrl,
  onUploaded,
  disabled,
  variant = "desktop",
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
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
      const url = await uploadCenterPhoto(brandId, centerId, file);
      setPreview(url);
      onUploaded(url);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Photo upload failed");
    } finally {
      setPending(false);
    }
  };

  const openPicker = () => inputRef.current?.click();

  return (
    <div className={`ed-center-photo-upload ed-center-photo-upload--${variant}`}>
      <input
        ref={inputRef}
        id={inputId}
        name="center-photo"
        className="ed-center-photo-upload__input"
        type="file"
        accept={ACCEPT}
        disabled={disabled || pending}
        onChange={(e) => void handleChange(e.target.files?.[0])}
      />

      <div className="ed-center-photo-upload__visual">
        {preview ? (
          <img src={preview} alt="" className="ed-center-photo-preview" width={112} height={112} />
        ) : (
          <div className="ed-center-photo-preview ed-center-photo-preview--empty" aria-hidden>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
        )}
        {variant === "desktop" ? (
          <button
            type="button"
            className="ed-center-photo-upload__edit"
            aria-label="Update center photo"
            disabled={disabled || pending}
            onClick={openPicker}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </button>
        ) : null}
      </div>

      {variant === "mobile" ? (
        <button
          type="button"
          className="ed-center-photo-upload__mobile-trigger"
          disabled={disabled || pending}
          onClick={openPicker}
        >
          Update Center Photo
        </button>
      ) : (
        <p className="ed-text-sm ed-muted">Center master photo shown on your public site.</p>
      )}

      {pending ? <p className="ed-text-sm ed-muted">Uploading…</p> : null}
      {localError ? (
        <p className="ed-text-sm" role="alert">
          {localError}
        </p>
      ) : null}
    </div>
  );
}
