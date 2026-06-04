import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@edunudg/ui";
import { HomepageEditorForm } from "@/features/marketing/HomepageEditorForm";
import { HomepageEditorShell } from "@/features/marketing/HomepageEditorShell";
import { fetchHomepageConfig, saveHomepageConfig } from "@/lib/homepageApi";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/homepageDefaults";
import type { HomepageConfig } from "@/types/homepage";

export function HomepageEditorPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["marketing-homepage"], queryFn: fetchHomepageConfig });
  const [config, setConfig] = useState<HomepageConfig>(DEFAULT_HOMEPAGE_CONFIG);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) setConfig(data);
  }, [data]);

  const save = useMutation({
    mutationFn: () => saveHomepageConfig(config),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["marketing-homepage"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  if (isLoading) return <p>Loading homepage config…</p>;

  return (
    <HomepageEditorShell
      title="Marketing homepage"
      subtitle={
        <a href="/" target="_blank" rel="noreferrer">
          Preview live site
        </a>
      }
      actions={
        <>
          <Link to="/">
            <Button variant="ghost">Preview</Button>
          </Link>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving…" : saved ? "Saved" : "Save changes"}
          </Button>
        </>
      }
    >
      <HomepageEditorForm config={config} onChange={setConfig} uploadScope={{ kind: "platform" }} />
    </HomepageEditorShell>
  );
}
