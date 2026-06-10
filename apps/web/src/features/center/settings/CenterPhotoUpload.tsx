import { useEffect, useId, useState } from "react";
import { uploadCenterPhoto } from "@/lib/centerPhotoStorage";

const ACCEPT = "image/png,image/jpeg,image/webp,image/gif";

type Props = {
  brandId: string;
  centerId: string;
  currentPhotoUrl?: string | null;
  onUploaded: (url: string) => void;
  disabled?: boolean;
};

export function CenterPhotoUpload({
  brandId,
  centerId,
  currentPhotoUrl,
  onUploaded,
  disabled,
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
      const url = await uploadCenterPhoto(brandId, centerId, file);
      setPreview(url);
      onUploaded(url);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Photo upload failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="ed-field ed-center-photo-upload">
      <label className="ed-field__label" htmlFor={inputId}>
        Center photo
      </label>
      <p className="ed-text-sm ed-muted">Shown on your public center website. Upload replaces the previous photo.</p>
      <div className="ed-center-photo-upload__row">
        {preview ? (
          <img src={preview} alt="" className="ed-center-photo-preview" width={96} height={96} />
        ) : (
          <div className="ed-center-photo-preview ed-center-photo-preview--empty" aria-hidden>
            No photo
          </div>
        )}
        <input
          id={inputId}
          name="center-photo"
          className="ed-field__input"
          type="file"
          accept={ACCEPT}
          disabled={disabled || pending}
          onChange={(e) => void handleChange(e.target.files?.[0])}
        />
      </div>
      {pending ? <p className="ed-text-sm ed-muted">Uploading…</p> : null}
      {localError ? (
        <p className="ed-text-sm" role="alert">
          {localError}
        </p>
      ) : null}
    </div>
  );
}
