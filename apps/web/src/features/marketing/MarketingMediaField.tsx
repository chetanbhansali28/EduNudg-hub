import { useId, useRef, useState } from "react";
import {
  uploadMarketingMedia,
  type MarketingUploadScope,
} from "@/lib/marketingMediaStorage";
import { isVideoMediaUrl } from "@/lib/mediaUrl";

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

  return (
    <div className="ed-field">
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
      <input
        ref={inputRef}
        id={inputId}
        className="ed-field__input"
        type="file"
        accept={MARKETING_MEDIA_ACCEPT}
        disabled={disabled || pending}
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
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
