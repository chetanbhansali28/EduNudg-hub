import { useEffect, useId, useState } from "react";
import { Button } from "@edunudg/ui";
import {
  activeMerchandisePhotoUrls,
  clearMerchandiseProductPhoto,
  MERCHANDISE_PHOTO_MAX_SLOTS,
  normalizeMerchandisePhotoUrls,
  uploadMerchandiseProductPhoto,
} from "@/lib/merchandiseProductPhotoStorage";

const ACCEPT = "image/png,image/jpeg,image/webp,image/gif";

type Props = {
  brandId: string;
  catalogItemId: string;
  photoUrls: string[] | null | undefined;
  onChange: (urls: string[]) => void;
  disabled?: boolean;
};

export function MerchandiseProductPhotos({ brandId, catalogItemId, photoUrls, onChange, disabled }: Props) {
  const baseId = useId();
  const [slots, setSlots] = useState(() => normalizeMerchandisePhotoUrls(photoUrls));
  const [pendingSlot, setPendingSlot] = useState<number | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setSlots(normalizeMerchandisePhotoUrls(photoUrls));
  }, [photoUrls]);

  const handleUpload = async (slot: number, file: File | undefined) => {
    if (!file) return;
    setLocalError(null);
    setPendingSlot(slot);
    try {
      const next = await uploadMerchandiseProductPhoto(brandId, catalogItemId, slot, file);
      setSlots(next);
      onChange(next);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Photo upload failed");
    } finally {
      setPendingSlot(null);
    }
  };

  const handleRemove = async (slot: number) => {
    setLocalError(null);
    setPendingSlot(slot);
    try {
      const next = await clearMerchandiseProductPhoto(brandId, catalogItemId, slot);
      setSlots(next);
      onChange(next);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Could not remove photo");
    } finally {
      setPendingSlot(null);
    }
  };

  const activeCount = activeMerchandisePhotoUrls(slots).length;

  return (
    <div className="ed-merch-photos">
      <p className="ed-text-sm ed-muted">
        Product photos ({activeCount}/{MERCHANDISE_PHOTO_MAX_SLOTS}) — upload replaces the photo in that slot.
      </p>
      <div className="ed-merch-photos__grid">
        {Array.from({ length: MERCHANDISE_PHOTO_MAX_SLOTS }, (_, i) => {
          const slot = i + 1;
          const url = slots[i]?.trim() || null;
          const inputId = `${baseId}-slot-${slot}`;
          const busy = pendingSlot === slot;

          return (
            <div key={slot} className="ed-merch-photos__slot">
              <span className="ed-merch-photos__slot-label">Photo {slot}</span>
              {url ? (
                <img src={url} alt="" className="ed-merch-photos__thumb" width={72} height={72} />
              ) : (
                <div className="ed-merch-photos__placeholder" aria-hidden>
                  No image
                </div>
              )}
              <input
                id={inputId}
                type="file"
                accept={ACCEPT}
                className="ed-field__input"
                disabled={disabled || busy}
                onChange={(e) => void handleUpload(slot, e.target.files?.[0])}
              />
              {url ? (
                <Button
                  variant="ghost"
                  onClick={() => void handleRemove(slot)}
                  disabled={disabled || busy}
                >
                  Remove
                </Button>
              ) : null}
              {busy ? <span className="ed-text-sm ed-muted">Saving…</span> : null}
            </div>
          );
        })}
      </div>
      {localError ? (
        <p className="ed-text-sm" role="alert">
          {localError}
        </p>
      ) : null}
    </div>
  );
}
