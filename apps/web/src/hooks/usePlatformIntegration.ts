import { useQuery } from "@tanstack/react-query";
import { fetchPlatformIntegrations } from "@/lib/platformIntegrationsApi";
import {
  mergePlatformIntegrations,
  type PlatformIntegrationKey,
} from "@/lib/platformIntegrations";

export function usePlatformIntegrations(): Record<PlatformIntegrationKey, boolean> {
  const query = useQuery({
    queryKey: ["platform-integrations"],
    queryFn: fetchPlatformIntegrations,
    staleTime: 60_000,
  });
  return mergePlatformIntegrations(query.data);
}

export function usePlatformIntegration(key: PlatformIntegrationKey): boolean {
  const integrations = usePlatformIntegrations();
  return integrations[key];
}
