import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MutationError, PipelineWorkspace } from "@edunudg/ui";
import { useOpsBreakpoint } from "@/features/center/hooks/useOpsBreakpoint";
import { listMerchandisePromoCodes, upsertMerchandisePromoCode } from "@/lib/merchandiseOrdersApi";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { useSavedFlash } from "@/features/shared/useSavedFlash";
import { BrandMerchandiseAddPromoPanel } from "./BrandMerchandiseAddPromoPanel";
import { BrandMerchandisePromoCard } from "./BrandMerchandisePromoCard";
import { BrandMerchandisePromoFormFields } from "./BrandMerchandisePromoFormFields";
import { MerchandisePipelineListItem } from "./MerchandisePipelineListItem";
import {
  filterMerchandisePromos,
  promoDiscountLabel,
  promoUsesLabel,
  type MerchandisePromoRow,
} from "./merchandisePageHelpers";
import { emptyPromoForm, promoFormToPayload, promoRowToForm, type PromoForm } from "./promoForm";
import "./brandMerchandiseCatalog.css";

type Props = {
  brandId: string;
  formOpen?: boolean;
  onFormOpenChange?: (open: boolean) => void;
  search?: string;
};

export function BrandMerchandisePromoSection({
  brandId,
  formOpen = false,
  onFormOpenChange,
  search = "",
}: Props) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const promoSaved = useSavedFlash();
  const { isDesktop } = useOpsBreakpoint();
  const [form, setForm] = useState<PromoForm>(emptyPromoForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PromoForm>(emptyPromoForm);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const promos = useQuery({
    queryKey: ["merchandise-promo-codes", brandId],
    enabled: !!brandId,
    queryFn: () => listMerchandisePromoCodes(brandId) as Promise<MerchandisePromoRow[]>,
  });

  const allItems = promos.data ?? [];
  const filteredItems = useMemo(() => filterMerchandisePromos(allItems, search), [allItems, search]);

  useEffect(() => {
    if (formOpen) return;
    if (selectedId && filteredItems.some((item) => item.id === selectedId)) return;
    setSelectedId(filteredItems[0]?.id ?? null);
    setEditingId(null);
  }, [filteredItems, formOpen, selectedId]);

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["merchandise-promo-codes", brandId] });

  const closeAddForm = () => {
    setForm(emptyPromoForm);
    onFormOpenChange?.(false);
  };

  const create = useMutation({
    mutationFn: async () => {
      clear();
      return upsertMerchandisePromoCode(brandId, promoFormToPayload(form));
    },
    onSuccess: (itemId) => {
      invalidate();
      setForm(emptyPromoForm);
      setSelectedId(itemId);
      onFormOpenChange?.(false);
    },
    onError: capture,
  });

  const update = useMutation({
    mutationFn: async (id: string) => {
      clear();
      await upsertMerchandisePromoCode(brandId, promoFormToPayload(editForm, id));
    },
    onSuccess: () => {
      invalidate();
      promoSaved.flash();
      window.setTimeout(() => setEditingId(null), 1500);
    },
    onError: capture,
  });

  const startEdit = (item: MerchandisePromoRow) => {
    setEditingId(item.id);
    setEditForm(promoRowToForm(item));
  };

  const selectedItem = filteredItems.find((item) => item.id === selectedId) ?? null;

  const renderCard = (item: MerchandisePromoRow) => (
    <BrandMerchandisePromoCard
      key={item.id}
      item={item}
      editing={editingId === item.id}
      editForm={editForm}
      saveDisabled={!editForm.code.trim()}
      savePending={update.isPending}
      saveSaved={promoSaved.saved && editingId === item.id}
      onEdit={() => startEdit(item)}
      onCancelEdit={() => setEditingId(null)}
      onSave={() => update.mutate(item.id)}
      onEditFormChange={setEditForm}
    />
  );

  const addPanel = (
    <BrandMerchandiseAddPromoPanel
      open={formOpen}
      onSubmit={() => create.mutate()}
      onClose={closeAddForm}
      submitDisabled={!form.code.trim()}
      submitPending={create.isPending}
    >
      <BrandMerchandisePromoFormFields form={form} onChange={setForm} />
    </BrandMerchandiseAddPromoPanel>
  );

  const emptyCopy = allItems.length === 0 ? "No promo codes yet." : "No promo codes match this view.";
  const listEmpty = !promos.isLoading && filteredItems.length === 0 && !formOpen ? (
    <p className="ed-brand-merch-catalog__empty">{emptyCopy}</p>
  ) : null;

  const listPanel = promos.isLoading ? (
    <p className="ed-text-sm ed-muted">Loading promo codes…</p>
  ) : filteredItems.length === 0 ? (
    listEmpty
  ) : (
    <div className="ed-franchise-apps-page__desktop-list">
      {filteredItems.map((item) => (
        <MerchandisePipelineListItem
          key={item.id}
          selected={item.id === selectedId}
          badge={item.is_active ? "Active" : "Inactive"}
          badgeTone={item.is_active ? "approved" : "pending"}
          when={promoDiscountLabel(item)}
          title={item.code}
          location={promoUsesLabel(item)}
          onClick={() => {
            setSelectedId(item.id);
            onFormOpenChange?.(false);
            setEditingId(null);
          }}
        />
      ))}
    </div>
  );

  const detailPanel = formOpen ? (
    addPanel
  ) : selectedItem ? (
    <div className="ed-brand-merch-catalog">{renderCard(selectedItem)}</div>
  ) : (
    <div className="ed-franchise-apps-page__placeholder">
      <p className="ed-text-sm ed-muted">Select a promo code to review the discount and usage limits.</p>
    </div>
  );

  return (
    <>
      <MutationError message={error} />

      {isDesktop ? (
        <PipelineWorkspace detailOpen={!!selectedItem || formOpen} list={listPanel} detail={detailPanel} />
      ) : (
        <>
          {addPanel}
          <div className="ed-brand-merch-catalog">
            {promos.isLoading ? <p className="ed-text-sm ed-muted">Loading promo codes…</p> : null}
            {listEmpty}
            {filteredItems.map((item) => renderCard(item))}
          </div>
        </>
      )}
    </>
  );
}
