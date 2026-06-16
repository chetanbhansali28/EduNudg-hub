import { useEffect, useRef } from "react";
import { Button, CatalogFormPanel, FormGrid, Input, ToggleField } from "@edunudg/ui";
import { MerchandiseProductPhotos } from "./MerchandiseProductPhotos";
import type { CatalogItemForm } from "./BrandMerchandiseCatalogCard";

type Props = {
  open: boolean;
  form: CatalogItemForm;
  onFormChange: (next: CatalogItemForm) => void;
  onSubmit: () => void;
  onClose: () => void;
  submitDisabled: boolean;
  submitPending: boolean;
  brandId: string;
  savedItemId: string | null;
  photoUrls: string[];
  onPhotosChange: () => void;
};

export function BrandMerchandiseAddCatalogPanel({
  open,
  form,
  onFormChange,
  onSubmit,
  onClose,
  submitDisabled,
  submitPending,
  brandId,
  savedItemId,
  photoUrls,
  onPhotosChange,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const saved = savedItemId != null;

  useEffect(() => {
    if (!open || !panelRef.current) return;
    const frame = requestAnimationFrame(() => {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(frame);
  }, [open, savedItemId]);

  if (!open) return null;

  return (
    <div ref={panelRef} className="ed-brand-merch-add-panel" id="brand-merch-add-form">
      <CatalogFormPanel
        title="Add catalog item"
        description={
          saved
            ? "Item saved. Add product photos, then finish when you are done."
            : "Create a SKU centers can order from your merchandise store."
        }
        footer={
          <>
            {saved ? (
              <Button onClick={onClose}>Done</Button>
            ) : (
              <Button onClick={onSubmit} disabled={submitDisabled || submitPending}>
                Add item
              </Button>
            )}
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </>
        }
      >
        <FormGrid columns={2}>
          <Input
            label="SKU"
            value={form.sku}
            onChange={(value) => onFormChange({ ...form, sku: value })}
            placeholder="e.g. KIT001"
            editable={!saved}
          />
          <Input
            label="Name"
            value={form.name}
            onChange={(value) => onFormChange({ ...form, name: value })}
            placeholder="e.g. Level 1 Kit"
            editable={!saved}
          />
          <Input
            label="Price (₹)"
            value={form.priceRupees}
            onChange={(value) => onFormChange({ ...form, priceRupees: value })}
            type="number"
            placeholder="0.00"
            editable={!saved}
          />
          <Input
            label="Currency"
            value={form.currency}
            onChange={(value) => onFormChange({ ...form, currency: value })}
            placeholder="INR"
            editable={!saved}
          />
        </FormGrid>
        <ToggleField
          label="Active"
          description="Available to franchise centers"
          checked={form.isActive}
          onChange={(checked) => onFormChange({ ...form, isActive: checked })}
        />
        {saved ? (
          <div className="ed-brand-merch-add-panel__photos">
            <p className="ed-brand-merch-add-panel__photos-label">Product photos</p>
            <p className="ed-text-sm ed-muted ed-brand-merch-add-panel__photos-hint">
              Upload up to 5 images. Slot 1 is used as the main catalog photo.
            </p>
            <MerchandiseProductPhotos
              brandId={brandId}
              catalogItemId={savedItemId}
              photoUrls={photoUrls}
              onChange={() => onPhotosChange()}
            />
          </div>
        ) : (
          <p className="ed-text-sm ed-muted ed-brand-merch-add-panel__photos-hint">
            Product photos can be added after the catalog item is saved.
          </p>
        )}
      </CatalogFormPanel>
    </div>
  );
}
