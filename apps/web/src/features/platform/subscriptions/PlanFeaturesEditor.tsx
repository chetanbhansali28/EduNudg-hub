import { FormGrid, Input, ToggleField, ToggleGrid } from "@edunudg/ui";
import {
  PLAN_FEATURE_META,
  type SubscriptionPlanFeatures,
} from "@/lib/subscriptionPlanFeatures";

type Props = {
  values: Record<keyof SubscriptionPlanFeatures, string>;
  onChange: (key: keyof SubscriptionPlanFeatures, value: string) => void;
};

export function PlanFeaturesEditor({ values, onChange }: Props) {
  const limits = PLAN_FEATURE_META.filter((m) => m.kind === "limit");
  const flags = PLAN_FEATURE_META.filter((m) => m.kind === "boolean");

  return (
    <div className="ed-form-section">
      <p className="ed-text-sm ed-muted">Plan entitlements (leave limits blank for unlimited)</p>
      <FormGrid>
        {limits.map((meta) => (
          <Input
            key={meta.key}
            label={meta.label}
            value={values[meta.key]}
            onChange={(v) => onChange(meta.key, v)}
            type="number"
            placeholder="Unlimited"
          />
        ))}
      </FormGrid>
      <ToggleGrid>
        {flags.map((meta) => (
          <ToggleField
            key={meta.key}
            label={meta.label}
            description={meta.description}
            checked={values[meta.key] === "true"}
            onChange={(checked) => onChange(meta.key, String(checked))}
          />
        ))}
      </ToggleGrid>
    </div>
  );
}
