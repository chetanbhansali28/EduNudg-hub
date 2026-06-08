import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, DataList, ListRow, MutationError, Select } from "@edunudg/ui";
import { updateBrandMarketingTheme } from "@/lib/brandLandingApi";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { MARKETING_THEME_LABELS, MARKETING_THEMES, parseMarketingTheme, type MarketingTheme } from "@/types/homepage";
import { useMutationError } from "./hooks/useMutationError";

interface BrandThemeRow {
  id: string;
  slug: string;
  name: string;
  marketing_theme: string;
}

export function BrandMarketingThemesPanel() {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [drafts, setDrafts] = useState<Record<string, MarketingTheme>>({});

  const brands = useQuery({
    queryKey: ["brands", "marketing-themes"],
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("brands")
        .select("id, slug, name, marketing_theme")
        .is("deleted_at", null)
        .order("name");
      return supabaseList(data, qErr) as BrandThemeRow[];
    },
  });

  useEffect(() => {
    if (!brands.data) return;
    const next: Record<string, MarketingTheme> = {};
    for (const b of brands.data) {
      next[b.id] = parseMarketingTheme(b.marketing_theme);
    }
    setDrafts(next);
  }, [brands.data]);

  const saveTheme = useMutation({
    mutationFn: async ({ brandId, theme }: { brandId: string; theme: MarketingTheme }) => {
      clear();
      await updateBrandMarketingTheme(brandId, theme);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["brands"] });
      void qc.invalidateQueries({ queryKey: ["brand-landing"] });
    },
    onError: capture,
  });

  return (
    <Card title="Brand marketing themes">
      <p className="ed-text-sm ed-muted" style={{ marginBottom: "0.75rem" }}>
        Choose the public website layout for each brand. Brand owners edit page content in their portal; themes are
        managed here alongside the platform homepage.
      </p>
      <MutationError message={error} />
      <DataList
        items={brands.data ?? []}
        empty="No brands yet."
        render={(b) => {
          const draft = drafts[b.id] ?? parseMarketingTheme(b.marketing_theme);
          const saved = parseMarketingTheme(b.marketing_theme);
          const dirty = draft !== saved;
          return (
            <ListRow
              aside={
                <Button
                  onClick={() => saveTheme.mutate({ brandId: b.id, theme: draft })}
                  disabled={!dirty || saveTheme.isPending}
                >
                  {saveTheme.isPending ? "Saving…" : "Save"}
                </Button>
              }
            >
              <div style={{ minWidth: "12rem" }}>
                <strong>{b.name}</strong>
                <div className="ed-text-sm ed-muted">{b.slug}</div>
              </div>
              <Select
                label="Website theme"
                value={draft}
                onChange={(v) => setDrafts((prev) => ({ ...prev, [b.id]: parseMarketingTheme(v) }))}
                options={MARKETING_THEMES.map((theme) => ({ value: theme, label: MARKETING_THEME_LABELS[theme] }))}
              />
            </ListRow>
          );
        }}
      />
    </Card>
  );
}
