import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MutationError, PipelineWorkspace } from "@edunudg/ui";
import { ConfirmDeleteDialog } from "@/features/shared/ConfirmDeleteDialog";
import { useOpsBreakpoint } from "@/features/center/hooks/useOpsBreakpoint";
import {
  deleteMerchandiseCatalogItem,
  listMerchandiseCatalog,
  upsertMerchandiseCatalogItem,
} from "@/lib/merchandiseOrdersApi";
import { catalogStatusBadge, formatCatalogPrice, formatCatalogSku } from "@/lib/brandMerchandiseHelpers";
import {
  filterMerchandiseCatalog,
  type CatalogTabFilter,
} from "./merchandisePageHelpers";
import { paiseToRupeesInput, rupeesToPaise } from "@/lib/inrCurrency";
import { getSupabase } from "@/lib/supabase";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { useSavedFlash } from "@/features/shared/useSavedFlash";
import { BrandMerchandiseAddCatalogPanel } from "./BrandMerchandiseAddCatalogPanel";
import {
  BrandMerchandiseCatalogCard,
  type CatalogItemForm,
  type CatalogItemRow,
} from "./BrandMerchandiseCatalogCard";
import { MerchandisePipelineListItem } from "./MerchandisePipelineListItem";
import "./brandMerchandiseCatalog.css";

const emptyForm: CatalogItemForm = { sku: "", name: "", priceRupees: "", currency: "INR", isActive: true };

type Props = {
  brandId: string;
  formOpen: boolean;
  onFormOpenChange: (open: boolean) => void;
  listFilter?: CatalogTabFilter;
  search?: string;
};

export function BrandMerchandiseCatalogSection({
  brandId,
  formOpen,
  onFormOpenChange,
  listFilter = "all",
  search = "",
}: Props) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const catalogSaved = useSavedFlash();
  const { isDesktop } = useOpsBreakpoint();
  const [form, setForm] = useState(emptyForm);
  const [savedItemId, setSavedItemId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const catalog = useQuery({
    queryKey: ["merchandise-catalog", brandId],
    enabled: !!brandId,
    queryFn: () => listMerchandiseCatalog(brandId),
  });

  const allItems = catalog.data ?? [];
  const filteredItems = useMemo(
    () => filterMerchandiseCatalog(allItems, listFilter, search),
    [allItems, listFilter, search],
  );

  useEffect(() => {
    if (formOpen) return;
    if (selectedId && filteredItems.some((item) => item.id === selectedId)) return;
    setSelectedId(filteredItems[0]?.id ?? null);
    setEditingId(null);
  }, [filteredItems, formOpen, selectedId]);

  const savedItemPhotos = useQuery({
    queryKey: ["merchandise-catalog-item-photos", brandId, savedItemId],
    enabled: !!brandId && !!savedItemId,
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("merchandise_catalog")
        .select("photo_urls")
        .eq("brand_id", brandId)
        .eq("id", savedItemId!)
        .maybeSingle();
      if (qErr) throw qErr;
      return (data?.photo_urls ?? []) as string[];
    },
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["merchandise-catalog", brandId] });
    if (savedItemId) {
      void qc.invalidateQueries({ queryKey: ["merchandise-catalog-item-photos", brandId, savedItemId] });
    }
  };

  const closeAddForm = () => {
    setForm(emptyForm);
    setSavedItemId(null);
    onFormOpenChange(false);
  };

  const create = useMutation({
    mutationFn: async () => {
      clear();
      return upsertMerchandiseCatalogItem(brandId, {
        sku: form.sku,
        name: form.name,
        priceCents: rupeesToPaise(form.priceRupees),
        currency: form.currency,
        isActive: form.isActive,
      });
    },
    onSuccess: (itemId) => {
      invalidate();
      setSavedItemId(itemId);
      setSelectedId(itemId);
    },
    onError: capture,
  });

  const update = useMutation({
    mutationFn: async (id: string) => {
      clear();
      await upsertMerchandiseCatalogItem(brandId, {
        id,
        sku: editForm.sku,
        name: editForm.name,
        priceCents: rupeesToPaise(editForm.priceRupees),
        currency: editForm.currency,
        isActive: editForm.isActive,
      });
    },
    onSuccess: () => {
      invalidate();
      catalogSaved.flash();
      window.setTimeout(() => setEditingId(null), 1500);
    },
    onError: capture,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      clear();
      await deleteMerchandiseCatalogItem(brandId, id);
    },
    onSuccess: (_void, id) => {
      invalidate();
      setDeleteId(null);
      if (editingId) setEditingId(null);
      if (selectedId === id) setSelectedId(null);
    },
    onError: capture,
  });

  const startEdit = (item: CatalogItemRow) => {
    setEditingId(item.id);
    setEditForm({
      sku: item.sku,
      name: item.name,
      priceRupees: paiseToRupeesInput(item.price_cents),
      currency: item.currency,
      isActive: item.is_active,
    });
  };

  const selectedItem = filteredItems.find((item) => item.id === selectedId) ?? null;

  const renderCard = (item: CatalogItemRow) => (
    <BrandMerchandiseCatalogCard
      key={item.id}
      item={item}
      brandId={brandId}
      editing={editingId === item.id}
      editForm={editForm}
      saveDisabled={!editForm.sku.trim() || !editForm.name.trim()}
      savePending={update.isPending}
      saveSaved={catalogSaved.saved && editingId === item.id}
      onEdit={() => startEdit(item)}
      onCancelEdit={() => setEditingId(null)}
      onSave={() => update.mutate(item.id)}
      onDelete={() => setDeleteId(item.id)}
      onEditFormChange={setEditForm}
      onPhotosChange={invalidate}
    />
  );

  const addPanel = (
    <BrandMerchandiseAddCatalogPanel
      open={formOpen}
      form={form}
      onFormChange={setForm}
      onSubmit={() => create.mutate()}
      onClose={closeAddForm}
      submitDisabled={!form.sku.trim() || !form.name.trim()}
      submitPending={create.isPending}
      brandId={brandId}
      savedItemId={savedItemId}
      photoUrls={savedItemPhotos.data ?? []}
      onPhotosChange={invalidate}
    />
  );

  const emptyCopy =
    allItems.length === 0
      ? "No merchandise items in catalog yet."
      : "No merchandise items match this view.";

  const listEmpty = !catalog.isLoading && filteredItems.length === 0 && !formOpen ? (
    <p className="ed-brand-merch-catalog__empty">{emptyCopy}</p>
  ) : null;

  const listPanel = catalog.isLoading ? (
    <p className="ed-text-sm ed-muted">Loading catalog…</p>
  ) : filteredItems.length === 0 ? (
    listEmpty
  ) : (
    <div className="ed-franchise-apps-page__desktop-list">
      {filteredItems.map((item) => {
        const status = catalogStatusBadge(item.is_active);
        return (
          <MerchandisePipelineListItem
            key={item.id}
            selected={item.id === selectedId}
            badge={status.label}
            badgeTone={item.is_active ? "approved" : "pending"}
            when={formatCatalogPrice(item.price_cents, item.currency, item.is_active)}
            title={item.name}
            location={formatCatalogSku(item.sku)}
            onClick={() => {
              setSelectedId(item.id);
              onFormOpenChange(false);
              setEditingId(null);
            }}
          />
        );
      })}
    </div>
  );

  const detailPanel = formOpen ? (
    addPanel
  ) : selectedItem ? (
    <div className="ed-brand-merch-catalog">{renderCard(selectedItem)}</div>
  ) : (
    <div className="ed-franchise-apps-page__placeholder">
      <p className="ed-text-sm ed-muted">Select a catalog item to review price, photos, and availability.</p>
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
            {catalog.isLoading ? <p className="ed-text-sm ed-muted">Loading catalog…</p> : null}
            {listEmpty}
            {filteredItems.map((item) => renderCard(item))}
          </div>
        </>
      )}

      <ConfirmDeleteDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) remove.mutate(deleteId);
        }}
        title="Delete catalog item?"
        description="This permanently removes the SKU and its product photos."
        confirmPending={remove.isPending}
      />
    </>
  );
}
