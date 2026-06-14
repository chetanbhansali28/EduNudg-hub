import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HomepageEditorForm } from "@/features/marketing/HomepageEditorForm";
import { HomepageEditorShell } from "@/features/marketing/HomepageEditorShell";
import { fetchHomepageEditorBundle, saveHomepageConfig } from "@/lib/homepageApi";
import { formatLastSavedLabel } from "@/lib/formatRelativeTime";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/homepageDefaults";
import type { HomepageConfig } from "@/types/homepage";

function configsEqual(a: HomepageConfig, b: HomepageConfig): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

const HOMEPAGE_EDITOR_QUERY_KEY = ["marketing-homepage", "editor"] as const;

export function HomepageEditorPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: HOMEPAGE_EDITOR_QUERY_KEY,
    queryFn: fetchHomepageEditorBundle,
  });
  const [config, setConfig] = useState<HomepageConfig>(DEFAULT_HOMEPAGE_CONFIG);
  const [baseline, setBaseline] = useState<HomepageConfig>(DEFAULT_HOMEPAGE_CONFIG);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!data?.config) return;
    setConfig(data.config);
    setBaseline(data.config);
    setUpdatedAt(data.updatedAt);
  }, [data]);

  const isDirty = useMemo(() => !configsEqual(config, baseline), [config, baseline]);

  const save = useMutation({
    mutationFn: (override?: HomepageConfig) => saveHomepageConfig(override ?? config),
    onSuccess: (_data, override) => {
      const next = override ?? config;
      setBaseline(next);
      setUpdatedAt(new Date().toISOString());
      void qc.invalidateQueries({ queryKey: HOMEPAGE_EDITOR_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: ["marketing-homepage"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  if (isLoading) return <p>Loading homepage config…</p>;

  return (
    <>
      <HomepageEditorShell
        title="Homepage Configuration"
        subtitle="Manage your public brand recruitment site and center enrollment templates."
        lastSavedLabel={formatLastSavedLabel(updatedAt)}
        onSave={() => save.mutate(undefined)}
        onDiscard={() => setConfig(baseline)}
        isDirty={isDirty}
        savePending={save.isPending}
        saved={saved}
      >
        <HomepageEditorForm
          config={config}
          onChange={setConfig}
          uploadScope={{ kind: "platform" }}
          onPersist={(next) => save.mutate(next)}
        />
      </HomepageEditorShell>
    </>
  );
}
