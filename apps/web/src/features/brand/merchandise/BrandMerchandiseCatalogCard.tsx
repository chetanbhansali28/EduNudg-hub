import { useRef } from "react";
import { Button, FormGrid, Input, ToggleField } from "@edunudg/ui";
import {
  catalogItemDescription,
  catalogStatusBadge,
  formatCatalogPrice,
  formatCatalogSku,
  photoAssetsLabel,
} from "@/lib/brandMerchandiseHelpers";
import { activeMerchandisePhotoUrls } from "@/lib/merchandiseProductPhotoStorage";
import { MerchandiseProductPhotos } from "./MerchandiseProductPhotos";

const TRASH_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

export type CatalogItemForm = {
  sku: string;
  name: string;
  priceRupees: string;
  currency: string;
  isActive: boolean;
};

export type CatalogItemRow = {
  id: string;
  sku: string;
  name: string;
  price_cents: number;
  currency: string;
  is_active: boolean;
  photo_urls: string[] | null;
};

type Props = {
  item: CatalogItemRow;
  brandId: string;
  editing: boolean;
  editForm: CatalogItemForm;
  saveDisabled: boolean;
  savePending: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  onEditFormChange: (next: CatalogItemForm) => void;
  onPhotosChange: () => void;
};

export function BrandMerchandiseCatalogCard({
  item,
  brandId,
  editing,
  editForm,
  saveDisabled,
  savePending,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onEditFormChange,
  onPhotosChange,
}: Props) {
  const galleryRef = useRef<HTMLDivElement>(null);
  const status = catalogStatusBadge(item.is_active);
  const uploadedCount = activeMerchandisePhotoUrls(item.photo_urls).length;
  const price = formatCatalogPrice(item.price_cents, item.currency, item.is_active);
  const priceClass = item.is_active ? "ed-brand-merch-card__price--active" : "ed-brand-merch-card__price--draft";

  const openGallery = () => {
    galleryRef.current?.querySelector<HTMLButtonElement>('[data-testid="manage-gallery-trigger"]')?.click();
  };

  const actionButtons = (
    <>
      <button type="button" className="ed-brand-merch-card__edit-btn" onClick={onEdit}>
        Edit Details
      </button>
      <button
        type="button"
        className="ed-brand-merch-card__delete-btn"
        aria-label={`Delete ${item.name}`}
        onClick={onDelete}
      >
        {TRASH_ICON}
      </button>
    </>
  );

  return (
    <article className="ed-brand-merch-card">
      <div className="ed-brand-merch-card__inner">
        <div className="ed-brand-merch-card__details">
          <div className="ed-brand-merch-card__head">
            <div className="ed-brand-merch-card__title-row">
              <h3 className="ed-brand-merch-card__title">{editing ? editForm.name || item.name : item.name}</h3>
              <span className={`ed-brand-merch-card__badge ed-brand-merch-card__badge--${status.tone}`}>
                {status.label}
              </span>
            </div>
            <p className={`ed-brand-merch-card__price ${priceClass} ed-brand-merch-card__mobile-price`}>{price}</p>
          </div>

          <p className="ed-brand-merch-card__sku ed-brand-merch-card__sku--mobile">{formatCatalogSku(item.sku)}</p>

          {editing ? (
            <div className="ed-brand-merch-card__edit-form">
              <FormGrid>
                <Input
                  label="SKU"
                  value={editForm.sku}
                  onChange={(value) => onEditFormChange({ ...editForm, sku: value })}
                />
                <Input
                  label="Name"
                  value={editForm.name}
                  onChange={(value) => onEditFormChange({ ...editForm, name: value })}
                />
                <Input
                  label="Price (₹)"
                  value={editForm.priceRupees}
                  onChange={(value) => onEditFormChange({ ...editForm, priceRupees: value })}
                  type="number"
                />
                <Input
                  label="Currency"
                  value={editForm.currency}
                  onChange={(value) => onEditFormChange({ ...editForm, currency: value })}
                />
              </FormGrid>
              <ToggleField
                label="Active"
                description="Available to franchise centers"
                checked={editForm.isActive}
                onChange={(checked) => onEditFormChange({ ...editForm, isActive: checked })}
              />
              <div className="ed-brand-merch-card__edit-actions">
                <Button onClick={onSave} disabled={saveDisabled || savePending}>
                  Save changes
                </Button>
                <Button variant="ghost" onClick={onCancelEdit}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="ed-brand-merch-card__description">{catalogItemDescription(item.name)}</p>
              <div className="ed-brand-merch-card__fields">
                <div className="ed-brand-merch-card__field">
                  <span>SKU</span>
                  <strong>{item.sku}</strong>
                </div>
                <div className="ed-brand-merch-card__field ed-brand-merch-card__field--price">
                  <span>Price</span>
                  <strong className={priceClass}>{price}</strong>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="ed-brand-merch-card__assets" ref={galleryRef}>
          <div className="ed-brand-merch-card__assets-head">
            <p className="ed-brand-merch-card__assets-title">{photoAssetsLabel(uploadedCount)}</p>
            <button type="button" className="ed-brand-merch-card__assets-link" onClick={openGallery}>
              Manage Gallery
            </button>
          </div>
          <MerchandiseProductPhotos
            brandId={brandId}
            catalogItemId={item.id}
            photoUrls={item.photo_urls}
            onChange={() => onPhotosChange()}
            variant="catalog"
          />
        </div>

        {!editing ? <div className="ed-brand-merch-card__actions">{actionButtons}</div> : null}
      </div>
    </article>
  );
}
