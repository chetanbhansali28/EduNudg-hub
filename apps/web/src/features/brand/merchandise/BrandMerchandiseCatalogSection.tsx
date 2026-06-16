import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, FormGrid, Input, MutationError, ToggleField } from "@edunudg/ui";
import { ConfirmDeleteDialog } from "@/features/shared/ConfirmDeleteDialog";
import {
  deleteMerchandiseCatalogItem,
  upsertMerchandiseCatalogItem,
} from "@/lib/merchandiseOrdersApi";
import { paiseToRupeesInput, rupeesToPaise } from "@/lib/inrCurrency";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { BrandMerchandiseAddCatalogPanel } from "./BrandMerchandiseAddCatalogPanel";
import {
  BrandMerchandiseCatalogCard,
  type CatalogItemForm,
  type CatalogItemRow,
} from "./BrandMerchandiseCatalogCard";
import "./brandMerchandiseCatalog.css";

const emptyForm: CatalogItemForm = { sku: "", name: "", priceRupees: "", currency: "INR", isActive: true };

type Props = {
  brandId: string;
  formOpen: boolean;
  onFormOpenChange: (open: boolean) => void;
};

export function BrandMerchandiseCatalogSection({ brandId, formOpen, onFormOpenChange }: Props) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [form, setForm] = useState(emptyForm);
  const [savedItemId, setSavedItemId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const catalog = useQuery({
    queryKey: ["merchandise-catalog", brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("merchandise_catalog")
        .select("id, sku, name, price_cents, currency, is_active, photo_urls")
        .eq("brand_id", brandId)
        .order("name");
      return supabaseList(data, qErr) as CatalogItemRow[];
    },
  });

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
      setEditingId(null);
    },
    onError: capture,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      clear();
      await deleteMerchandiseCatalogItem(brandId, id);
    },
    onSuccess: () => {
      invalidate();
      setDeleteId(null);
      if (editingId) setEditingId(null);
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

  return (
    <>
      <MutationError message={error} />

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

      <div className="ed-brand-merch-catalog">
        {catalog.isLoading ? <p className="ed-text-sm ed-muted">Loading catalog…</p> : null}
        {!catalog.isLoading && (catalog.data ?? []).length === 0 && !formOpen ? (
          <p className="ed-brand-merch-catalog__empty">No merchandise items in catalog yet.</p>
        ) : null}
        {(catalog.data ?? []).map((item) => (
          <BrandMerchandiseCatalogCard
            key={item.id}
            item={item}
            brandId={brandId}
            editing={editingId === item.id}
            editForm={editForm}
            saveDisabled={!editForm.sku.trim() || !editForm.name.trim()}
            savePending={update.isPending}
            onEdit={() => startEdit(item)}
            onCancelEdit={() => setEditingId(null)}
            onSave={() => update.mutate(item.id)}
            onDelete={() => setDeleteId(item.id)}
            onEditFormChange={setEditForm}
            onPhotosChange={invalidate}
          />
        ))}
      </div>

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
