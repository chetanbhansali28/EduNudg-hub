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
  Select,
  ToggleField,
} from "@edunudg/ui";
import { listMerchandisePromoCodes, upsertMerchandisePromoCode } from "@/lib/merchandiseOrdersApi";
import { CrudRowActions } from "@/features/platform/components/CrudRowActions";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { AddFormSection } from "@/features/shared/AddFormSection";
import { useAddFormCloser } from "@/features/shared/useAddFormCloser";

type PromoRow = {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_quantity: number;
  max_uses: number | null;
  use_count: number;
  is_active: boolean;
};

const emptyForm = {
  code: "",
  description: "",
  discountType: "percent" as "percent" | "fixed",
  discountValue: "",
  minQuantity: "1",
  maxUses: "",
  isActive: true,
};

type Props = { brandId: string };

function discountLabel(row: PromoRow): string {
  return row.discount_type === "percent" ? `${row.discount_value}% off` : `₹${(row.discount_value / 100).toFixed(2)} off`;
}

export function BrandMerchandisePromoSection({ brandId }: Props) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const { bindClose, closeAddForm } = useAddFormCloser();

  const promos = useQuery({
    queryKey: ["merchandise-promo-codes", brandId],
    enabled: !!brandId,
    queryFn: () => listMerchandisePromoCodes(brandId) as Promise<PromoRow[]>,
  });

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["merchandise-promo-codes", brandId] });

  const toInput = (row: PromoRow) => ({
    code: row.code,
    description: row.description ?? "",
    discountType: row.discount_type,
    discountValue: String(row.discount_type === "percent" ? row.discount_value : row.discount_value / 100),
    minQuantity: String(row.min_quantity),
    maxUses: row.max_uses != null ? String(row.max_uses) : "",
    isActive: row.is_active,
  });

  const toPayload = (f: typeof emptyForm, id?: string) => ({
    id,
    code: f.code.trim(),
    description: f.description.trim() || undefined,
    discountType: f.discountType,
    discountValue:
      f.discountType === "percent"
        ? parseInt(f.discountValue, 10) || 0
        : Math.round(parseFloat(f.discountValue || "0") * 100),
    minQuantity: parseInt(f.minQuantity, 10) || 1,
    maxUses: f.maxUses.trim() ? parseInt(f.maxUses, 10) : undefined,
    isActive: f.isActive,
  });

  const create = useMutation({
    mutationFn: async () => {
      clear();
      await upsertMerchandisePromoCode(brandId, toPayload(form));
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
      await upsertMerchandisePromoCode(brandId, toPayload(editForm, id));
    },
    onSuccess: () => {
      invalidate();
      setEditingId(null);
    },
    onError: capture,
  });

  const renderForm = (
    f: typeof emptyForm,
    setF: (value: typeof emptyForm | ((prev: typeof emptyForm) => typeof emptyForm)) => void,
    onSubmit: () => void,
    submitLabel: string,
    pending: boolean
  ) => (
    <>
      <FormGrid>
        <Input label="Code" value={f.code} onChange={(v) => setF((prev) => ({ ...prev, code: v.toUpperCase() }))} />
        <Input
          label="Description"
          value={f.description}
          onChange={(v) => setF((prev) => ({ ...prev, description: v }))}
        />
        <Select
          label="Discount type"
          value={f.discountType}
          onChange={(v) => setF((prev) => ({ ...prev, discountType: v }))}
          options={[
            { value: "percent", label: "Percent" },
            { value: "fixed", label: "Fixed amount (₹)" },
          ]}
        />
        <Input
          label={f.discountType === "percent" ? "Discount (%)" : "Discount (₹)"}
          value={f.discountValue}
          onChange={(v) => setF((prev) => ({ ...prev, discountValue: v }))}
          type="number"
        />
        <Input
          label="Min quantity"
          value={f.minQuantity}
          onChange={(v) => setF((prev) => ({ ...prev, minQuantity: v }))}
          type="number"
        />
        <Input
          label="Max uses (optional)"
          value={f.maxUses}
          onChange={(v) => setF((prev) => ({ ...prev, maxUses: v }))}
          type="number"
        />
      </FormGrid>
      <ToggleField
        label="Active"
        checked={f.isActive}
        onChange={(checked) => setF((prev) => ({ ...prev, isActive: checked }))}
      />
      <Button onClick={onSubmit} disabled={!f.code.trim() || pending}>
        {submitLabel}
      </Button>
    </>
  );

  return (
    <>
      <MutationError message={error} />

      <PageGridFull>
        <AddFormSection buttonLabel="Add promo code" panelTitle="Add promo code">
          {({ close }) => {
            bindClose(close);
            return renderForm(form, setForm, () => create.mutate(), "Add promo code", create.isPending);
          }}
        </AddFormSection>
      </PageGridFull>

      <PageGridFull>
        <Card title="Promo codes">
          <DataList
            items={promos.data ?? []}
            empty="No promo codes yet."
            render={(row) => {
              const editing = editingId === row.id;
              return (
                <ListRow
                  aside={
                    <CrudRowActions
                      editing={editing}
                      onEdit={() => {
                        setEditingId(row.id);
                        setEditForm(toInput(row));
                      }}
                      onSave={() => update.mutate(row.id)}
                      onCancel={() => setEditingId(null)}
                      saveDisabled={!editForm.code.trim() || update.isPending}
                    />
                  }
                >
                  {editing ? (
                    <div className="ed-form-section">
                      {renderForm(editForm, setEditForm, () => update.mutate(row.id), "Save", update.isPending)}
                    </div>
                  ) : (
                    <div>
                      <strong>{row.code}</strong>
                      <Badge tone={row.is_active ? "success" : "default"}>
                        {row.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <div className="ed-text-sm ed-muted">
                        {discountLabel(row)} · min qty {row.min_quantity}
                        {row.max_uses != null ? ` · ${row.use_count}/${row.max_uses} uses` : ` · ${row.use_count} uses`}
                      </div>
                      {row.description && <div className="ed-text-sm">{row.description}</div>}
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
