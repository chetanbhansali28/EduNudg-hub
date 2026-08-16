import { FormGrid, Input, Select, ToggleField } from "@edunudg/ui";
import type { PromoForm } from "./promoForm";

type Props = {
  form: PromoForm;
  onChange: (next: PromoForm) => void;
};

export function BrandMerchandisePromoFormFields({ form, onChange }: Props) {
  const patch = (partial: Partial<PromoForm>) => onChange({ ...form, ...partial });

  return (
    <>
      <FormGrid>
        <Input label="Code" value={form.code} onChange={(value) => patch({ code: value.toUpperCase() })} />
        <Input label="Description" value={form.description} onChange={(value) => patch({ description: value })} />
        <Select
          label="Discount type"
          value={form.discountType}
          onChange={(value) => patch({ discountType: value as PromoForm["discountType"] })}
          options={[
            { value: "percent", label: "Percent" },
            { value: "fixed", label: "Fixed amount (₹)" },
          ]}
        />
        <Input
          label={form.discountType === "percent" ? "Discount (%)" : "Discount (₹)"}
          value={form.discountValue}
          onChange={(value) => patch({ discountValue: value })}
          type="number"
        />
        <Input
          label="Min quantity"
          value={form.minQuantity}
          onChange={(value) => patch({ minQuantity: value })}
          type="number"
        />
        <Input
          label="Max uses (optional)"
          value={form.maxUses}
          onChange={(value) => patch({ maxUses: value })}
          type="number"
        />
      </FormGrid>
      <ToggleField
        label="Active"
        description="Available to franchise centers at checkout"
        checked={form.isActive}
        onChange={(checked) => patch({ isActive: checked })}
      />
    </>
  );
}
