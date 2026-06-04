import { useId, useState } from "react";
import {
  uploadMarketingMedia,
  type MarketingUploadScope,
} from "@/lib/marketingMediaStorage";

const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml,image/gif";
const VIDEO_ACCEPT = "video/mp4,video/webm,video/quicktime";

type Props = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  mediaType: "image" | "video";
  uploadSubdir: string;
  uploadScope: MarketingUploadScope;
  disabled?: boolean;
};

export function MarketingMediaField({
  label,
  value,
  onChange,
  mediaType,
  uploadSubdir,
  uploadScope,
  disabled,
}: Props) {
  const inputId = useId();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accept = mediaType === "video" ? VIDEO_ACCEPT : IMAGE_ACCEPT;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setPending(true);
    try {
      const url = await uploadMarketingMedia(uploadScope, uploadSubdir, file);
      onChange(url);
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
      {value && mediaType === "image" ? (
        <img src={value} alt="" className="ed-marketing-media-preview" />
      ) : null}
      {value && mediaType === "video" ? (
        <video src={value} className="ed-marketing-media-preview" controls muted playsInline />
      ) : null}
      <input
        id={inputId}
        className="ed-field__input"
        type="file"
        accept={accept}
        disabled={disabled || pending}
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
      {value ? (
        <p className="ed-text-sm ed-muted ed-marketing-media-url" title={value}>
          Current: {value.length > 72 ? `${value.slice(0, 69)}…` : value}
        </p>
      ) : (
        <p className="ed-text-sm ed-muted">No file selected yet.</p>
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
