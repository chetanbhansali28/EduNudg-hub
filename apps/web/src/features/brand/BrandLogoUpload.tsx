import { useEffect, useId, useState } from "react";
import { uploadBrandLogo } from "@/lib/brandLogoStorage";

const ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml,image/gif";

type BrandLogoUploadProps = {
  brandId: string | null;
  currentLogoUrl?: string | null;
  onUploaded?: (publicUrl: string) => void;
  disabled?: boolean;
};

export function BrandLogoUpload({ brandId, currentLogoUrl, onUploaded, disabled }: BrandLogoUploadProps) {
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
      onUploaded?.(url);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Logo upload failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="ed-field">
      <label className="ed-field__label" htmlFor={inputId}>
        Brand logo
      </label>
      {preview ? (
        <img src={preview} alt="" className="ed-brand-logo-preview" width={64} height={64} />
      ) : null}
      <input
        id={inputId}
        className="ed-field__input"
        type="file"
        accept={ACCEPT}
        disabled={disabled || !brandId || pending}
        onChange={(e) => void handleChange(e.target.files?.[0])}
      />
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
