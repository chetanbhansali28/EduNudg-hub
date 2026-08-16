import { Button, SaveButton } from "@edunudg/ui";
import { promoDiscountLabel, promoUsesLabel, type MerchandisePromoRow } from "./merchandisePageHelpers";
import { BrandMerchandisePromoFormFields } from "./BrandMerchandisePromoFormFields";
import type { PromoForm } from "./promoForm";

type Props = {
  item: MerchandisePromoRow;
  editing: boolean;
  editForm: PromoForm;
  saveDisabled: boolean;
  savePending: boolean;
  saveSaved?: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onEditFormChange: (next: PromoForm) => void;
};

export function BrandMerchandisePromoCard({
  item,
  editing,
  editForm,
  saveDisabled,
  savePending,
  saveSaved = false,
  onEdit,
  onCancelEdit,
  onSave,
  onEditFormChange,
}: Props) {
  const statusTone = item.is_active ? "active" : "draft";

  return (
    <article className="ed-brand-merch-card ed-brand-merch-card--simple">
      <div className="ed-brand-merch-card__inner">
        <div className="ed-brand-merch-card__details">
          <div className="ed-brand-merch-card__head">
            <div className="ed-brand-merch-card__title-row">
              <h3 className="ed-brand-merch-card__title">{editing ? editForm.code || item.code : item.code}</h3>
              <span className={`ed-brand-merch-card__badge ed-brand-merch-card__badge--${statusTone}`}>
                {item.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="ed-brand-merch-card__price ed-brand-merch-card__price--active">{promoDiscountLabel(item)}</p>
          </div>

          {editing ? (
            <div className="ed-brand-merch-card__edit-form">
              <BrandMerchandisePromoFormFields form={editForm} onChange={onEditFormChange} />
              <div className="ed-brand-merch-card__edit-actions">
                <SaveButton
                  onClick={onSave}
                  disabled={saveDisabled}
                  pending={savePending}
                  saved={saveSaved}
                  label="Save changes"
                />
                <Button variant="ghost" onClick={onCancelEdit}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              {item.description ? <p className="ed-brand-merch-card__description">{item.description}</p> : null}
              <div className="ed-brand-merch-card__fields">
                <div className="ed-brand-merch-card__field">
                  <span>Discount</span>
                  <strong>{promoDiscountLabel(item)}</strong>
                </div>
                <div className="ed-brand-merch-card__field">
                  <span>Usage</span>
                  <strong>{promoUsesLabel(item)}</strong>
                </div>
              </div>
              <div className="ed-brand-merch-card__actions">
                <button type="button" className="ed-brand-merch-card__edit-btn" onClick={onEdit}>
                  Edit Details
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
