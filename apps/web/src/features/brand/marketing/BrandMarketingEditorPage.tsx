import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HomepageEditorForm } from "@/features/marketing/HomepageEditorForm";
import { AbacusClassicEditorForm } from "@/features/marketing/AbacusClassicEditorForm";
import { HomepageEditorPanel, HomepageEditorShell } from "@/features/marketing/HomepageEditorShell";
import { useBrandScope } from "@/features/brand/hooks/useBrandScope";
import { fetchBrandMarketingEditor, landingConfigToPartial, saveBrandMarketingLanding } from "@/lib/brandLandingEditorApi";
import { formatLastSavedLabel } from "@/lib/formatRelativeTime";
import type { HomepageConfig } from "@/types/homepage";

function configsEqual(a: HomepageConfig, b: HomepageConfig): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function BrandMarketingEditorPage() {
  const { brandId, missingBrand } = useBrandScope();
  const qc = useQueryClient();
  const [brandConfig, setBrandConfig] = useState<HomepageConfig | null>(null);
  const [centerConfig, setCenterConfig] = useState<HomepageConfig | null>(null);
  const [brandBaseline, setBrandBaseline] = useState<HomepageConfig | null>(null);
  const [centerBaseline, setCenterBaseline] = useState<HomepageConfig | null>(null);
  const [existingSettings, setExistingSettings] = useState<Record<string, unknown>>({});
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [brandSaved, setBrandSaved] = useState(false);
  const [centerSaved, setCenterSaved] = useState(false);
  const [brandUpdatedAt, setBrandUpdatedAt] = useState<string | null>(null);
  const [centerUpdatedAt, setCenterUpdatedAt] = useState<string | null>(null);
  const [marketingTheme, setMarketingTheme] = useState<import("@/types/homepage").MarketingTheme>("novu");

  const editor = useQuery({
    queryKey: ["brand-marketing-editor", brandId],
    enabled: !!brandId,
    queryFn: () => fetchBrandMarketingEditor(brandId!),
  });

  useEffect(() => {
    if (!editor.data) return;
    setBrandConfig(editor.data.landingConfig);
    setCenterConfig(editor.data.centerLandingConfig);
    setBrandBaseline(editor.data.landingConfig);
    setCenterBaseline(editor.data.centerLandingConfig);
    setExistingSettings(editor.data.existingSettings);
    setSettingsId(editor.data.settingsId);
    setMarketingTheme(editor.data.marketingTheme);
  }, [editor.data]);

  const brandDirty = useMemo(
    () => brandConfig && brandBaseline && !configsEqual(brandConfig, brandBaseline),
    [brandConfig, brandBaseline]
  );
  const centerDirty = useMemo(
    () => centerConfig && centerBaseline && !configsEqual(centerConfig, centerBaseline),
    [centerConfig, centerBaseline]
  );

  const saveBrand = useMutation({
    mutationFn: async (override?: HomepageConfig) => {
      const payload = override ?? brandConfig;
      if (!brandId || !payload) throw new Error("Brand required");
      await saveBrandMarketingLanding(
        brandId,
        settingsId,
        existingSettings,
        "landing",
        payload
      );
    },
    onSuccess: (_data, override) => {
      const payload = override ?? brandConfig;
      if (payload) {
        setBrandBaseline(payload);
        setExistingSettings((prev) => ({ ...prev, landing: landingConfigToPartial(payload) }));
      }
      setBrandUpdatedAt(new Date().toISOString());
      void qc.invalidateQueries({ queryKey: ["brand-marketing-editor", brandId] });
      void qc.invalidateQueries({ queryKey: ["brand-landing"] });
      setBrandSaved(true);
      setTimeout(() => setBrandSaved(false), 3000);
    },
  });

  const saveCenter = useMutation({
    mutationFn: async (override?: HomepageConfig) => {
      const payload = override ?? centerConfig;
      if (!brandId || !payload) throw new Error("Brand required");
      await saveBrandMarketingLanding(
        brandId,
        settingsId,
        existingSettings,
        "center_landing",
        payload
      );
    },
    onSuccess: (_data, override) => {
      const payload = override ?? centerConfig;
      if (payload) {
        setCenterBaseline(payload);
        setExistingSettings((prev) => ({
          ...prev,
          center_landing: landingConfigToPartial(payload),
        }));
      }
      setCenterUpdatedAt(new Date().toISOString());
      void qc.invalidateQueries({ queryKey: ["brand-marketing-editor", brandId] });
      void qc.invalidateQueries({ queryKey: ["center-landing"] });
      setCenterSaved(true);
      setTimeout(() => setCenterSaved(false), 3000);
    },
  });

  const lastSavedLabel = useMemo(() => {
    const stamps = [brandUpdatedAt, centerUpdatedAt].filter(Boolean) as string[];
    if (stamps.length === 0) return null;
    const latest = stamps.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
    return formatLastSavedLabel(latest);
  }, [brandUpdatedAt, centerUpdatedAt]);

  if (missingBrand) {
    return <p className="ed-empty">Brand context not found.</p>;
  }

  if (editor.isLoading || !brandConfig || !centerConfig || !brandBaseline || !centerBaseline) {
    return <p>Loading marketing pages…</p>;
  }

  return (
    <HomepageEditorShell
      title="Homepage Configuration"
      subtitle="Manage your public brand recruitment site and center enrollment templates."
      lastSavedLabel={lastSavedLabel}
    >
      <div className="ed-homepage-editor-pages">
        <HomepageEditorPanel
          title="Brand site (franchise recruitment)"
          onSave={() => saveBrand.mutate(brandConfig)}
          onDiscard={() => setBrandConfig(brandBaseline)}
          isDirty={!!brandDirty}
          savePending={saveBrand.isPending}
          saved={brandSaved}
          description={
            <>
              Public homepage on your brand hostname. Testimonial quotes come from published{" "}
              <Link to="/app/success-stories">success stories</Link>.
            </>
          }
        >
          {marketingTheme === "abacus-classic" || marketingTheme === "spark-academy" ? (
            <AbacusClassicEditorForm
              config={brandConfig}
              marketingTheme={marketingTheme}
              onChange={setBrandConfig}
              uploadScope={{ kind: "brand", brandId: brandId! }}
              onPersist={(next) => {
                setBrandConfig(next);
                saveBrand.mutate(next);
              }}
              testimonialsExternalHint={
                <p className="ed-text-sm ed-muted">
                  Manage quotes on the <Link to="/app/success-stories">Success stories</Link> page.
                </p>
              }
            />
          ) : (
            <HomepageEditorForm
              config={brandConfig}
              onChange={setBrandConfig}
              uploadScope={{ kind: "brand", brandId: brandId! }}
              onPersist={(next) => {
                setBrandConfig(next);
                saveBrand.mutate(next);
              }}
              testimonialsManagedExternally
              testimonialsExternalHint={
                <p className="ed-text-sm ed-muted">
                  Manage quotes on the <Link to="/app/success-stories">Success stories</Link> page.
                </p>
              }
            />
          )}
        </HomepageEditorPanel>

        <HomepageEditorPanel
          title="Center sites (parent enrollment template)"
          onSave={() => saveCenter.mutate(centerConfig)}
          onDiscard={() => setCenterConfig(centerBaseline)}
          isDirty={!!centerDirty}
          savePending={saveCenter.isPending}
          saved={centerSaved}
          description="Template for every center hostname. Center name and city are filled in per location."
        >
          {marketingTheme === "abacus-classic" ? (
            <AbacusClassicEditorForm
              config={centerConfig}
              marketingTheme={marketingTheme}
              onChange={setCenterConfig}
              uploadScope={{ kind: "brand", brandId: brandId! }}
              onPersist={(next) => {
                setCenterConfig(next);
                saveCenter.mutate(next);
              }}
            />
          ) : (
            <HomepageEditorForm
              config={centerConfig}
              onChange={setCenterConfig}
              uploadScope={{ kind: "brand", brandId: brandId! }}
              onPersist={(next) => {
                setCenterConfig(next);
                saveCenter.mutate(next);
              }}
            />
          )}
        </HomepageEditorPanel>
      </div>
    </HomepageEditorShell>
  );
}
