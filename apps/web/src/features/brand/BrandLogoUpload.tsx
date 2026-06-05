import { useEffect, useId, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { uploadBrandLogo } from "@/lib/brandLogoStorage";
import { invalidateBrandLogoCaches } from "@/lib/brandLogoCache";

const ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml,image/gif";

type BrandLogoUploadProps = {
  brandId: string | null;
  currentLogoUrl?: string | null;
  onUploaded?: (publicUrl: string) => void;
  disabled?: boolean;
  editable?: boolean;
};

export function BrandLogoUpload({
  brandId,
  currentLogoUrl,
  onUploaded,
  disabled,
  editable = false,
}: BrandLogoUploadProps) {
  const qc = useQueryClient();
  const inputId = useId();
  const [preview, setPreview] = useState<string | null>(currentLogoUrl?.trim() || null);
  const [pending, setPending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setPreview(currentLogoUrl?.trim() || null);
  }, [currentLogoUrl]);

  const handleChange = async (file: File | undefined) => {
    if (!file || !brandId) return;
    setLocalError(null);
    setPending(true);
    try {
      const url = await uploadBrandLogo(brandId, file);
      setPreview(url);
      invalidateBrandLogoCaches(qc, brandId);
      onUploaded?.(url);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Logo upload failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className={`ed-field ed-brand-logo-upload${editable ? " ed-field--editable" : ""}`}>
      <label className="ed-field__label" htmlFor={inputId}>
        Brand logo
      </label>
      <div className="ed-brand-logo-upload__row">
        {preview ? <img src={preview} alt="" className="ed-brand-logo-preview" width={40} height={40} /> : null}
        <input
          id={inputId}
          className="ed-field__input"
          type="file"
          accept={ACCEPT}
          disabled={disabled || !brandId || pending}
          onChange={(e) => void handleChange(e.target.files?.[0])}
        />
      </div>
      {!brandId ? (
        <p className="ed-text-sm ed-muted">Create the brand first, then upload a logo.</p>
      ) : null}
      {pending ? <p className="ed-text-sm ed-muted">Uploading…</p> : null}
      {localError ? (
        <p className="ed-text-sm" role="alert">
          {localError}
        </p>
      ) : null}
    </div>
  );
}
