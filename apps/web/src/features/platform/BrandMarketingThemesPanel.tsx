import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, MutationError, Select } from "@edunudg/ui";
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
  const [savingBrandId, setSavingBrandId] = useState<string | null>(null);

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
      setSavingBrandId(brandId);
      await updateBrandMarketingTheme(brandId, theme);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["brands"] });
      void qc.invalidateQueries({ queryKey: ["brand-landing"] });
      void qc.invalidateQueries({ queryKey: ["center-landing"] });
    },
    onError: capture,
    onSettled: () => setSavingBrandId(null),
  });

  const items = brands.data ?? [];

  return (
    <section className="ed-brand-marketing-themes" aria-labelledby="brand-marketing-themes-title">
      <header className="ed-brand-marketing-themes__header">
        <div>
          <h2 id="brand-marketing-themes-title" className="ed-brand-marketing-themes__title">
            Brand marketing themes
          </h2>
          <p className="ed-brand-marketing-themes__desc">
            Choose the public website layout for each brand. Brand owners edit page content in their portal; themes
            are managed here alongside the platform homepage.
          </p>
        </div>
        {items.length > 0 ? (
          <Badge tone="default">{items.length} brand{items.length === 1 ? "" : "s"}</Badge>
        ) : null}
      </header>

      <MutationError message={error} />

      {brands.isLoading ? (
        <p className="ed-muted ed-text-sm">Loading brands…</p>
      ) : items.length === 0 ? (
        <p className="ed-empty">No brands yet.</p>
      ) : (
        <ul className="ed-brand-marketing-themes__list">
          {items.map((brand) => {
            const draft = drafts[brand.id] ?? parseMarketingTheme(brand.marketing_theme);
            const saved = parseMarketingTheme(brand.marketing_theme);
            const dirty = draft !== saved;
            const isSaving = savingBrandId === brand.id;

            return (
              <li key={brand.id} className="ed-brand-marketing-themes__item">
                <div className="ed-brand-marketing-themes__brand">
                  <strong className="ed-brand-marketing-themes__name">{brand.name}</strong>
                  <span className="ed-brand-marketing-themes__slug">{brand.slug}</span>
                  {!dirty ? (
                    <Badge tone="success">{MARKETING_THEME_LABELS[saved]}</Badge>
                  ) : (
                    <Badge tone="warning">Unsaved changes</Badge>
                  )}
                </div>

                <div className="ed-brand-marketing-themes__field">
                  <Select
                    label="Website theme"
                    value={draft}
                    onChange={(value) =>
                      setDrafts((prev) => ({ ...prev, [brand.id]: parseMarketingTheme(value) }))
                    }
                    options={MARKETING_THEMES.map((theme) => ({
                      value: theme,
                      label: MARKETING_THEME_LABELS[theme],
                    }))}
                  />
                </div>

                <div className="ed-brand-marketing-themes__actions">
                  <Button
                    variant={dirty ? "primary" : "ghost"}
                    block
                    onClick={() => saveTheme.mutate({ brandId: brand.id, theme: draft })}
                    disabled={!dirty || isSaving}
                  >
                    {isSaving ? "Saving…" : dirty ? "Save theme" : "Saved"}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
