import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button, PageToolbar } from "@edunudg/ui";
import { HomepageEditorForm } from "@/features/marketing/HomepageEditorForm";
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
    <>
      <PageToolbar
        title="Marketing homepage"
        subtitle={
          <>
            Novu layout · Inter + Instrument Serif ·{" "}
            <a href="/" target="_blank" rel="noreferrer">
              Preview live
            </a>
          </>
        }
      >
        <Link to="/">
          <Button variant="ghost">Preview</Button>
        </Link>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? "Saving…" : saved ? "Saved" : "Save changes"}
        </Button>
      </PageToolbar>

      <HomepageEditorForm config={config} onChange={setConfig} />

      <p style={{ fontSize: "0.8125rem", color: "var(--ed-muted)", marginTop: "1rem" }}>
        Layout matches{" "}
        <a href="https://www.withnovu.com/" target="_blank" rel="noreferrer">
          withnovu.com
        </a>
        . Typography: Inter + Instrument Serif per{" "}
        <a href="https://onepagelove.com/novu" target="_blank" rel="noreferrer">
          One Page Love
        </a>
        .
      </p>
    </>
  );
}
