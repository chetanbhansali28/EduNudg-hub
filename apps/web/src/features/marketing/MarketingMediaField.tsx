import { useId, useRef, useState } from "react";
import { Button } from "@edunudg/ui";
import {
  uploadMarketingMedia,
  type MarketingUploadScope,
} from "@/lib/marketingMediaStorage";
import { isVideoMediaUrl } from "@/lib/mediaUrl";

function fieldNameFromLabel(label: string): string {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "field";
}

function fileNameFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    const name = path.split("/").pop();
    return name && name.length > 0 ? decodeURIComponent(name) : url;
  } catch {
    const parts = url.split("/");
    return parts[parts.length - 1] || url;
  }
}

/** Images and videos accepted in marketing media pickers. */
export const MARKETING_MEDIA_ACCEPT =
  "image/png,image/jpeg,image/webp,image/svg+xml,image/gif,video/mp4,video/webm,video/quicktime";

type Props = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  mediaType: "image" | "video";
  uploadSubdir: string;
  uploadScope: MarketingUploadScope;
  disabled?: boolean;
  layout?: "default" | "logo" | "hero";
  recommendedSize?: string;
  /** Called after a successful upload with the new public URL (e.g. auto-save config). */
  onUploaded?: (url: string) => void | Promise<void>;
};

export function MarketingMediaField({
  label,
  value,
  onChange,
  mediaType,
  uploadSubdir,
  uploadScope,
  disabled,
  layout = "default",
  recommendedSize,
  onUploaded,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showVideoPreview = mediaType === "video" || isVideoMediaUrl(value);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setPending(true);
    try {
      const url = await uploadMarketingMedia(uploadScope, uploadSubdir, file);
      onChange(url);
      await onUploaded?.(url);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setPending(false);
    }
  };

  const fileInput = (
    <input
      ref={inputRef}
      id={inputId}
      name={fieldNameFromLabel(label)}
      className="ed-field__input ed-marketing-media-input--hidden"
      type="file"
      accept={MARKETING_MEDIA_ACCEPT}
      disabled={disabled || pending}
      onChange={(e) => void handleFile(e.target.files?.[0])}
    />
  );

  if (layout === "logo") {
    return (
      <div className="ed-field ed-marketing-media-field ed-marketing-media-field--logo">
        <span className="ed-field__label">{label}</span>
        <div className="ed-marketing-media-logo">
          <div className="ed-marketing-media-logo__preview">
            {value ? (
              <img key={value} src={value} alt="" className="ed-marketing-media-logo__image" />
            ) : (
              <span className="ed-marketing-media-logo__placeholder material-symbols-outlined" aria-hidden>
                image
              </span>
            )}
          </div>
          <div className="ed-marketing-media-logo__actions">
            {fileInput}
            <Button variant="secondary" onClick={() => inputRef.current?.click()} disabled={disabled || pending}>
              <span className="material-symbols-outlined" aria-hidden>
                image
              </span>
              Change logo
            </Button>
            {value ? (
              <Button variant="danger" onClick={() => onChange("")} disabled={disabled || pending}>
                <span className="material-symbols-outlined" aria-hidden>
                  delete
                </span>
                Remove
              </Button>
            ) : null}
          </div>
        </div>
        {pending ? <p className="ed-text-sm ed-muted">Uploading…</p> : null}
        {error ? (
          <p className="ed-text-sm" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  if (layout === "hero") {
    return (
      <div className="ed-field ed-marketing-media-field ed-marketing-media-field--hero">
        <label className="ed-field__label" htmlFor={inputId}>
          {label}
        </label>
        {value && !showVideoPreview ? (
          <img key={value} src={value} alt="" className="ed-marketing-media-hero__preview" />
        ) : null}
        {value && showVideoPreview ? (
          <video
            key={value}
            src={value}
            className="ed-marketing-media-hero__preview"
            controls
            muted
            playsInline
          />
        ) : null}
        <div className="ed-marketing-media-hero__footer">
          {fileInput}
          <Button variant="secondary" onClick={() => inputRef.current?.click()} disabled={disabled || pending}>
            <span className="material-symbols-outlined" aria-hidden>
              upload
            </span>
            {value ? "Replace file" : "Upload file"}
          </Button>
          {value ? (
            <>
              <p className="ed-marketing-media-hero__filename">
                <span className="material-symbols-outlined" aria-hidden>
                  image
                </span>
                {fileNameFromUrl(value)}
              </p>
              {recommendedSize ? (
                <p className="ed-text-sm ed-muted">Recommended size: {recommendedSize}</p>
              ) : null}
              <button type="button" className="ed-link-button ed-text-sm" onClick={() => onChange("")}>
                Remove file
              </button>
            </>
          ) : (
            <p className="ed-text-sm ed-muted">No file selected yet. Upload PNG, JPEG, or MP4.</p>
          )}
        </div>
        {pending ? <p className="ed-text-sm ed-muted">Uploading…</p> : null}
        {error ? (
          <p className="ed-text-sm" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="ed-field ed-marketing-media-field">
      <label className="ed-field__label" htmlFor={inputId}>
        {label}
      </label>
      {value && !showVideoPreview ? (
        <img key={value} src={value} alt="" className="ed-marketing-media-preview" />
      ) : null}
      {value && showVideoPreview ? (
        <video
          key={value}
          src={value}
          className="ed-marketing-media-preview"
          controls
          muted
          playsInline
        />
      ) : null}
      {fileInput}
      {value ? (
        <p className="ed-text-sm ed-muted ed-marketing-media-url" title={value}>
          Current: {value.length > 72 ? `${value.slice(0, 69)}…` : value}
        </p>
      ) : (
        <p className="ed-text-sm ed-muted">No file selected yet. Upload PNG, JPEG, or MP4.</p>
      )}
      {pending ? <p className="ed-text-sm ed-muted">Uploading…</p> : null}
      {error ? (
        <p className="ed-text-sm" role="alert">
          {error}
        </p>
      ) : null}
      {value ? (
        <button type="button" className="ed-link-button ed-text-sm" onClick={() => onChange("")}>
          Remove file
        </button>
      ) : null}
    </div>
  );
}
