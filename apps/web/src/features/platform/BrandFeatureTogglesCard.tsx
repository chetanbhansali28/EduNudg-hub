import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, MutationError, SaveButton, ToggleField, ToggleGrid } from "@edunudg/ui";
import { FEATURE_FLAG_DEFAULTS, resolveFeatureFlags } from "@/hooks/useFeatureFlag";
import { getSupabase } from "@/lib/supabase";
import { useMutationError } from "@/features/platform/hooks/useMutationError";

export const BRAND_FEATURE_TOGGLES: { key: string; label: string }[] = [
  { key: "student_leads", label: "Student leads" },
  { key: "franchise_applications", label: "Franchise applications" },
  { key: "brand_billing", label: "Platform billing" },
  { key: "campaigns", label: "Campaigns" },
  { key: "merchandise", label: "Merchandise catalog & orders" },
];

type Props = {
  brandId: string;
  settingsId: string | null;
  settings: Record<string, unknown>;
  onSaved: () => void;
};

export function BrandFeatureTogglesCard({ brandId, settingsId, settings, onSaved }: Props) {
  const stored = (settings.features ?? {}) as Record<string, boolean>;
  const [flags, setFlags] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const { key } of BRAND_FEATURE_TOGGLES) {
      initial[key] = resolveFeatureFlags(stored, key);
    }
    return initial;
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const next: Record<string, boolean> = {};
    for (const { key } of BRAND_FEATURE_TOGGLES) {
      next[key] = resolveFeatureFlags(stored, key);
    }
    setFlags(next);
  }, [settings.features]);
  const { error, clear, capture } = useMutationError();

  const save = useMutation({
    mutationFn: async () => {
      clear();
      const merged = {
        ...settings,
        features: { ...stored, ...flags },
      };
      if (settingsId) {
        const { error: mErr } = await getSupabase()
          .from("brand_settings")
          .update({ settings: merged })
          .eq("id", settingsId);
        if (mErr) throw mErr;
      } else {
        const { error: mErr } = await getSupabase()
          .from("brand_settings")
          .insert({ brand_id: brandId, settings: merged });
        if (mErr) throw mErr;
      }
    },
    onSuccess: () => {
      onSaved();
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    },
    onError: capture,
  });

  return (
    <Card
      title="Features"
      actions={<SaveButton onClick={() => save.mutate()} pending={save.isPending} saved={saved} />}
    >
      <p className="ed-text-sm ed-muted">
        Control which modules are active for this brand&apos;s portal and franchise centers.
      </p>
      <MutationError message={error} />
      <ToggleGrid>
        {BRAND_FEATURE_TOGGLES.map(({ key, label }) => (
          <ToggleField
            key={key}
            label={label}
            checked={flags[key] ?? FEATURE_FLAG_DEFAULTS[key] ?? false}
            onChange={(checked) => setFlags((prev) => ({ ...prev, [key]: checked }))}
          />
        ))}
      </ToggleGrid>
    </Card>
  );
}
