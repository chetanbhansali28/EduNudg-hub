import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase";
import { fetchPlatformBrandsHome } from "@/lib/platformBrandsHomeApi";
import { useMutationError } from "./hooks/useMutationError";
import { BrandsPageView } from "./BrandsPageView";

export function BrandsPage() {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();

  const home = useQuery({
    queryKey: ["platform-brands-home"],
    queryFn: () => fetchPlatformBrandsHome(),
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["platform-brands-home"] });
    void qc.invalidateQueries({ queryKey: ["brands"] });
    void qc.invalidateQueries({ queryKey: ["platform-stats"] });
    void qc.invalidateQueries({ queryKey: ["platform-dashboard"] });
  };

  const deleteBrand = useMutation({
    mutationFn: async (id: string) => {
      clear();
      const { error: mErr } = await getSupabase()
        .from("brands")
        .update({ deleted_at: new Date().toISOString(), status: "archived" })
        .eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: invalidate,
    onError: capture,
  });

  if (home.isLoading) {
    return <p className="ed-text-sm ed-muted">Loading brands…</p>;
  }

  if (!home.data) {
    return <p className="ed-empty">Brands data unavailable.</p>;
  }

  return (
    <BrandsPageView
      data={home.data}
      error={error}
      onDeleteBrand={(id) => deleteBrand.mutate(id)}
      deletePending={deleteBrand.isPending}
    />
  );
}
