import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  DataList,
  FormGrid,
  Input,
  ListRow,
  MutationError,
  PageGridFull,
  ToggleField,
} from "@edunudg/ui";
import {
  deleteMerchandiseCatalogItem,
  upsertMerchandiseCatalogItem,
} from "@/lib/merchandiseOrdersApi";
import { formatInrFromPaise, paiseToRupeesInput, rupeesToPaise } from "@/lib/inrCurrency";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { CrudRowActions } from "@/features/platform/components/CrudRowActions";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { AddFormSection } from "@/features/shared/AddFormSection";
import { useAddFormCloser } from "@/features/shared/useAddFormCloser";

interface CatalogItem {
  id: string;
  sku: string;
  name: string;
  price_cents: number;
  currency: string;
  is_active: boolean;
}

const emptyForm = { sku: "", name: "", priceRupees: "", currency: "INR", isActive: true };

type Props = { brandId: string };

export function BrandMerchandiseCatalogSection({ brandId }: Props) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const { bindClose, closeAddForm } = useAddFormCloser();

  const catalog = useQuery({
    queryKey: ["merchandise-catalog", brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("merchandise_catalog")
        .select("id, sku, name, price_cents, currency, is_active")
        .eq("brand_id", brandId)
        .order("name");
      return supabaseList(data, qErr) as CatalogItem[];
    },
  });

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["merchandise-catalog", brandId] });

  const create = useMutation({
    mutationFn: async () => {
      clear();
      await upsertMerchandiseCatalogItem(brandId, {
        sku: form.sku,
        name: form.name,
        priceCents: rupeesToPaise(form.priceRupees),
        currency: form.currency,
        isActive: form.isActive,
      });
    },
    onSuccess: () => {
      invalidate();
      setForm(emptyForm);
      closeAddForm();
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
    onSuccess: invalidate,
    onError: capture,
  });

  return (
    <>
      <MutationError message={error} />

      <PageGridFull>
        <AddFormSection buttonLabel="Add catalog item" panelTitle="Add catalog item">
          {({ close }) => {
            bindClose(close);
            return (
              <>
                <FormGrid>
                  <Input label="SKU" value={form.sku} onChange={(v) => setForm((f) => ({ ...f, sku: v }))} />
                  <Input label="Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
                  <Input
                    label="Price (₹)"
                    value={form.priceRupees}
                    onChange={(v) => setForm((f) => ({ ...f, priceRupees: v }))}
                    type="number"
                    placeholder="0.00"
                  />
                  <Input
                    label="Currency"
                    value={form.currency}
                    onChange={(v) => setForm((f) => ({ ...f, currency: v }))}
                  />
                </FormGrid>
                <ToggleField
                  label="Active"
                  description="Available to franchise centers"
                  checked={form.isActive}
                  onChange={(checked) => setForm((f) => ({ ...f, isActive: checked }))}
                />
                <Button
                  onClick={() => create.mutate()}
                  disabled={!form.sku.trim() || !form.name.trim() || create.isPending}
                >
                  Add item
                </Button>
              </>
            );
          }}
        </AddFormSection>
      </PageGridFull>

      <PageGridFull>
        <Card title="Catalog items">
          <DataList
            items={catalog.data ?? []}
            empty="No merchandise items in catalog yet."
            render={(item) => {
              const editing = editingId === item.id;
              return (
                <ListRow
                  aside={
                    <CrudRowActions
                      editing={editing}
                      onEdit={() => {
                        setEditingId(item.id);
                        setEditForm({
                          sku: item.sku,
                          name: item.name,
                          priceRupees: paiseToRupeesInput(item.price_cents),
                          currency: item.currency,
                          isActive: item.is_active,
                        });
                      }}
                      onSave={() => update.mutate(item.id)}
                      onCancel={() => setEditingId(null)}
                      onDelete={() => remove.mutate(item.id)}
                      saveDisabled={!editForm.sku.trim() || !editForm.name.trim() || update.isPending}
                    />
                  }
                >
                  {editing ? (
                    <div className="ed-form-section">
                      <FormGrid>
                        <Input
                          label="SKU"
                          value={editForm.sku}
                          onChange={(v) => setEditForm((f) => ({ ...f, sku: v }))}
                        />
                        <Input
                          label="Name"
                          value={editForm.name}
                          onChange={(v) => setEditForm((f) => ({ ...f, name: v }))}
                        />
                        <Input
                          label="Price (₹)"
                          value={editForm.priceRupees}
                          onChange={(v) => setEditForm((f) => ({ ...f, priceRupees: v }))}
                          type="number"
                        />
                        <Input
                          label="Currency"
                          value={editForm.currency}
                          onChange={(v) => setEditForm((f) => ({ ...f, currency: v }))}
                        />
                      </FormGrid>
                      <ToggleField
                        label="Active"
                        checked={editForm.isActive}
                        onChange={(checked) => setEditForm((f) => ({ ...f, isActive: checked }))}
                      />
                    </div>
                  ) : (
                    <div>
                      <strong>{item.name}</strong>
                      <Badge tone={item.is_active ? "success" : "default"}>
                        {item.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <div className="ed-text-sm ed-muted">
                        {item.sku} · {formatInrFromPaise(item.price_cents, item.currency)}
                      </div>
                    </div>
                  )}
                </ListRow>
              );
            }}
          />
        </Card>
      </PageGridFull>
    </>
  );
}
