import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mergePlatformIntegrations } from "@/lib/platformIntegrations";
import { fetchPlatformIntegrations, savePlatformIntegrations } from "@/lib/platformIntegrationsApi";
import { useMutationError } from "./hooks/useMutationError";
import { SettingsPageView } from "./SettingsPageView";

export function SettingsPage() {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [saved, setSaved] = useState(false);
  const [flags, setFlags] = useState(() => mergePlatformIntegrations(undefined));
  const [savedFlags, setSavedFlags] = useState(() => mergePlatformIntegrations(undefined));

  const integrations = useQuery({
    queryKey: ["platform-integrations"],
    queryFn: fetchPlatformIntegrations,
  });

  useEffect(() => {
    if (!integrations.data) return;
    setFlags(integrations.data);
    setSavedFlags(integrations.data);
  }, [integrations.data]);

  const save = useMutation({
    mutationFn: async () => {
      clear();
      await savePlatformIntegrations(flags);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["platform-integrations"] });
      setSavedFlags(flags);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    },
    onError: capture,
  });

  return (
    <SettingsPageView
      flags={flags}
      savedFlags={savedFlags}
      onFlagsChange={setFlags}
      onSave={() => save.mutate()}
      onCancel={() => setFlags(savedFlags)}
      savePending={save.isPending}
      saved={saved}
      error={error}
      loading={integrations.isLoading}
    />
  );
}
