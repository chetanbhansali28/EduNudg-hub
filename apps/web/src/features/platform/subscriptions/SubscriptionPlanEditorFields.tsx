import { FormGrid, Input, Select, SubscriptionFeatureEntitlements, SubscriptionEntitlementRow } from "@edunudg/ui";
import { PLAN_FEATURE_META, type SubscriptionPlanFeatures } from "@/lib/subscriptionPlanFeatures";

const BILLING_INTERVALS = [
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

type PlanForm = {
  code: string;
  name: string;
  priceRupees: string;
  billing_interval: string;
  is_active: string;
  is_default: string;
  features: Record<keyof SubscriptionPlanFeatures, string>;
};

export function SubscriptionPlanEditorFields({
  form,
  onChange,
  variant = "desktop",
}: {
  form: PlanForm;
  onChange: (next: PlanForm) => void;
  variant?: "desktop" | "mobile";
}) {
  const limits = PLAN_FEATURE_META.filter((meta) => meta.kind === "limit");
  const flags = PLAN_FEATURE_META.filter((meta) => meta.kind === "boolean");

  const update = (patch: Partial<PlanForm>) => onChange({ ...form, ...patch });
  const updateFeature = (key: keyof SubscriptionPlanFeatures, value: string) =>
    onChange({ ...form, features: { ...form.features, [key]: value } });

  return (
    <>
      <FormGrid columns={variant === "mobile" ? 1 : 2}>
        {variant === "desktop" ? (
          <Input
            label="Plan code"
            value={form.code}
            onChange={(value) => update({ code: value })}
            placeholder="growth"
          />
        ) : null}
        <Input
          label="Plan name"
          value={form.name}
          onChange={(value) => update({ name: value })}
          placeholder="Growth"
        />
        <Input
          label={variant === "mobile" ? "Price (₹)" : "Price (₹ / month)"}
          value={form.priceRupees}
          onChange={(value) => update({ priceRupees: value })}
          type="number"
          step="0.01"
          placeholder="999.00"
        />
        <Select
          label={variant === "mobile" ? "Interval" : "Billing interval"}
          value={form.billing_interval as "month" | "year"}
          onChange={(value) => update({ billing_interval: value })}
          options={BILLING_INTERVALS.map((option) =>
            variant === "mobile" && option.value === "month"
              ? { ...option, label: "Monthly" }
              : option
          )}
        />
        {variant === "desktop" ? (
          <>
            <Input
              label="Max franchise centers"
              value={form.features.max_franchise_centers}
              onChange={(value) => updateFeature("max_franchise_centers", value)}
              type="number"
              placeholder="Unlimited"
            />
            <Input
              label="Max students"
              value={form.features.max_students}
              onChange={(value) => updateFeature("max_students", value)}
              type="number"
              placeholder="Unlimited"
            />
          </>
        ) : null}
      </FormGrid>

      <div className={variant === "mobile" ? "ed-sub-form-card" : undefined}>
        <SubscriptionEntitlementRow
          label="Active status"
          description={variant === "desktop" ? "Visible to all potential brands" : undefined}
          checked={form.is_active === "true"}
          onChange={(checked) => update({ is_active: String(checked) })}
        />
        <SubscriptionEntitlementRow
          label={variant === "mobile" ? "Default for new brands" : "Default plan"}
          description={variant === "desktop" ? "Assigned automatically on signup approval" : undefined}
          checked={form.is_default === "true"}
          onChange={(checked) => update({ is_default: String(checked) })}
        />
      </div>

      <SubscriptionFeatureEntitlements>
        {limits.filter(() => variant === "mobile").map((meta) => (
          <div key={meta.key} className="ed-sub-form-card">
            <Input
              label={meta.label}
              value={form.features[meta.key]}
              onChange={(value) => updateFeature(meta.key, value)}
              type="number"
              placeholder="Unlimited"
            />
          </div>
        ))}
        {flags.map((meta) => (
          <SubscriptionEntitlementRow
            key={meta.key}
            label={meta.label}
            description={meta.description}
            checked={form.features[meta.key] === "true"}
            onChange={(checked) => updateFeature(meta.key, String(checked))}
          />
        ))}
      </SubscriptionFeatureEntitlements>
    </>
  );
}

export type { PlanForm };
