import { useQuery } from "@tanstack/react-query";
import { fetchHomepageConfig } from "@/lib/homepageApi";
import { platformShellFromHomepage } from "@/lib/platformShellBranding";

/** Sidebar logo and product name for platform admin (/admin) — sourced from homepage editor. */
export function usePlatformShellBranding() {
  const query = useQuery({
    queryKey: ["marketing-homepage"],
    queryFn: fetchHomepageConfig,
    staleTime: 5 * 60_000,
  });

  return {
    ...platformShellFromHomepage(query.data),
    isLoading: query.isLoading,
  };
}
