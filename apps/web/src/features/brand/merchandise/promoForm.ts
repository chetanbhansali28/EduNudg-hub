export const emptyPromoForm = {
  code: "",
  description: "",
  discountType: "percent" as "percent" | "fixed",
  discountValue: "",
  minQuantity: "1",
  maxUses: "",
  isActive: true,
};

export type PromoForm = typeof emptyPromoForm;

export type PromoFormPayload = {
  id?: string;
  code: string;
  description?: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  minQuantity: number;
  maxUses?: number;
  isActive: boolean;
};

export function promoRowToForm(row: {
  code: string;
  description: string | null;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_quantity: number;
  max_uses: number | null;
  is_active: boolean;
}): PromoForm {
  return {
    code: row.code,
    description: row.description ?? "",
    discountType: row.discount_type,
    discountValue: String(row.discount_type === "percent" ? row.discount_value : row.discount_value / 100),
    minQuantity: String(row.min_quantity),
    maxUses: row.max_uses != null ? String(row.max_uses) : "",
    isActive: row.is_active,
  };
}

export function promoFormToPayload(form: PromoForm, id?: string): PromoFormPayload {
  return {
    id,
    code: form.code.trim(),
    description: form.description.trim() || undefined,
    discountType: form.discountType,
    discountValue:
      form.discountType === "percent"
        ? parseInt(form.discountValue, 10) || 0
        : Math.round(parseFloat(form.discountValue || "0") * 100),
    minQuantity: parseInt(form.minQuantity, 10) || 1,
    maxUses: form.maxUses.trim() ? parseInt(form.maxUses, 10) : undefined,
    isActive: form.isActive,
  };
}
