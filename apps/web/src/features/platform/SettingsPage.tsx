import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, Input, MutationError, PageToolbar, SaveButton, Select } from "@edunudg/ui";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { useMutationError } from "./hooks/useMutationError";
import { PlatformIntegrationsCard } from "./PlatformIntegrationsCard";
import {
  PLATFORM_SETTING_DEFINITIONS,
  PLATFORM_SETTING_TIMEZONES,
  patchFromPlatformSettingForm,
  platformSettingDefinition,
  valuesFromPlatformSetting,
} from "@/lib/platformSettingsCatalog";

interface PlatformSetting {
  id: string;
  key: string;
  value: Record<string, unknown>;
}

const MANAGED_KEYS = new Set(["marketing_homepage", "integrations"]);

export function SettingsPage() {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [selectedKey, setSelectedKey] = useState(PLATFORM_SETTING_DEFINITIONS[0]?.key ?? "defaults");
  const [form, setForm] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const settings = useQuery({
    queryKey: ["platform-settings"],
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("platform_settings")
        .select("id, key, value")
        .order("key");
      return supabaseList(data, qErr) as PlatformSetting[];
    },
  });

  const definition = platformSettingDefinition(selectedKey);
  const currentRow = useMemo(
    () => settings.data?.find((s) => s.key === selectedKey) ?? null,
    [settings.data, selectedKey]
  );

  useEffect(() => {
    if (!definition) return;
    setForm(valuesFromPlatformSetting(definition, currentRow?.value));
  }, [definition, currentRow?.id, currentRow?.value]);

  const saveSetting = useMutation({
    mutationFn: async () => {
      if (!definition) throw new Error("Unknown setting");
      clear();
      const value = patchFromPlatformSettingForm(definition, currentRow?.value, form);
      if (currentRow?.id) {
        const { error: mErr } = await getSupabase()
          .from("platform_settings")
          .update({ value })
          .eq("id", currentRow.id);
        if (mErr) throw mErr;
      } else {
        const { error: mErr } = await getSupabase()
          .from("platform_settings")
          .insert({ key: selectedKey, value });
        if (mErr) throw mErr;
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["platform-settings"] });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    },
    onError: capture,
  });

  const readOnlyKeys = (settings.data ?? [])
    .filter((s) => !MANAGED_KEYS.has(s.key) && !platformSettingDefinition(s.key))
    .map((s) => s.key);

  const settingOptions = PLATFORM_SETTING_DEFINITIONS.map((d) => ({
    value: d.key,
    label: d.label,
  }));

  return (
    <>
      <PageToolbar title="Platform Settings" />
      <MutationError message={error} />
      <PlatformIntegrationsCard />
      {definition ? (
        <Card
          title="Platform settings"
          actions={
            <SaveButton
              onClick={() => saveSetting.mutate()}
              pending={saveSetting.isPending}
              saved={saved}
              disabled={!definition.fields.every((f) => (form[f.name] ?? "").trim())}
            />
          }
        >
          <p className="ed-text-sm ed-muted">{definition.description}</p>
          <Select
            label="Setting"
            value={selectedKey}
            onChange={setSelectedKey}
            options={settingOptions}
          />
          {definition.fields.map((field) =>
            field.type === "timezone" ? (
              <Select
                key={field.name}
                label={field.label}
                value={form[field.name] ?? ""}
                onChange={(v) => setForm((prev) => ({ ...prev, [field.name]: v }))}
                placeholder={field.placeholder}
                options={PLATFORM_SETTING_TIMEZONES.map((tz) => ({ value: tz, label: tz }))}
              />
            ) : (
              <Input
                key={field.name}
                label={field.label}
                value={form[field.name] ?? ""}
                onChange={(v) => setForm((prev) => ({ ...prev, [field.name]: v }))}
                placeholder={field.placeholder}
              />
            )
          )}
          {readOnlyKeys.length > 0 ? (
            <p className="ed-text-sm ed-muted">
              Other keys in the database ({readOnlyKeys.join(", ")}) are managed by dedicated screens or migrations.
            </p>
          ) : null}
        </Card>
      ) : null}
    </>
  );
}
