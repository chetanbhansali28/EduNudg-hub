import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, MutationError, SaveButton, ToggleField, ToggleGrid } from "@edunudg/ui";
import {
  integrationsByCategory,
  mergePlatformIntegrations,
  PLATFORM_INTEGRATION_CATALOG,
} from "@/lib/platformIntegrations";
import { fetchPlatformIntegrations, savePlatformIntegrations } from "@/lib/platformIntegrationsApi";
import { useMutationError } from "@/features/platform/hooks/useMutationError";

export function PlatformIntegrationsCard() {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [saved, setSaved] = useState(false);
  const integrations = useQuery({
    queryKey: ["platform-integrations"],
    queryFn: fetchPlatformIntegrations,
  });
  const [flags, setFlags] = useState(() => mergePlatformIntegrations(undefined));

  useEffect(() => {
    if (integrations.data) setFlags(integrations.data);
  }, [integrations.data]);

  const save = useMutation({
    mutationFn: async () => {
      clear();
      await savePlatformIntegrations(flags);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["platform-integrations"] });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    },
    onError: capture,
  });

  const grouped = integrationsByCategory();

  return (
    <Card
      title="Integrations"
      actions={<SaveButton onClick={() => save.mutate()} pending={save.isPending} saved={saved} />}
    >
      <p className="ed-text-sm ed-muted">
        Turn integrations and public website features on or off. When off, the app skips the related flows — no data is
        deleted.
      </p>
      <MutationError message={error} />
      {integrations.isLoading ? (
        <p className="ed-text-sm ed-muted">Loading integrations…</p>
      ) : (
        <>
          {(Object.keys(grouped) as Array<keyof typeof grouped>).map((category) => (
            <div key={category} className="ed-form-section">
              <h3 className="ed-text-sm" style={{ margin: "0 0 0.5rem", fontWeight: 600 }}>
                {category}
              </h3>
              <ToggleGrid>
                {grouped[category].map((meta) => (
                  <ToggleField
                    key={meta.key}
                    label={meta.label}
                    description={meta.description}
                    checked={flags[meta.key]}
                    onChange={(checked) => setFlags((prev) => ({ ...prev, [meta.key]: checked }))}
                  />
                ))}
              </ToggleGrid>
            </div>
          ))}
          <p className="ed-text-sm ed-muted">
            {PLATFORM_INTEGRATION_CATALOG.length} integrations configured platform-wide.
          </p>
        </>
      )}
    </Card>
  );
}
