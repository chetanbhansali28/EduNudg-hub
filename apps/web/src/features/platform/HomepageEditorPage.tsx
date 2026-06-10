import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HomepageEditorForm } from "@/features/marketing/HomepageEditorForm";
import { HomepageEditorShell } from "@/features/marketing/HomepageEditorShell";
import { fetchHomepageConfig, saveHomepageConfig } from "@/lib/homepageApi";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/homepageDefaults";
import type { HomepageConfig } from "@/types/homepage";
import { BrandMarketingThemesPanel } from "./BrandMarketingThemesPanel";

export function HomepageEditorPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["marketing-homepage"], queryFn: fetchHomepageConfig });
  const [config, setConfig] = useState<HomepageConfig>(DEFAULT_HOMEPAGE_CONFIG);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) setConfig(data);
  }, [data]);

  const save = useMutation({
    mutationFn: (override?: HomepageConfig) => saveHomepageConfig(override ?? config),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["marketing-homepage"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  if (isLoading) return <p>Loading homepage config…</p>;

  return (
    <>
      <HomepageEditorShell
        title="Marketing & theming"
        subtitle="Edit the public EduNudg marketing site and brand website themes."
        onSave={() => save.mutate(undefined)}
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
      <div className="ed-homepage-admin__themes">
        <BrandMarketingThemesPanel />
      </div>
    </>
  );
}
