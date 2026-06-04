import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, PageToolbar } from "@edunudg/ui";
import { HomepageEditorForm } from "@/features/marketing/HomepageEditorForm";
import { useBrandScope } from "@/features/brand/hooks/useBrandScope";
import {
  fetchBrandMarketingEditor,
  saveBrandMarketingLanding,
  type BrandMarketingSettingsKey,
} from "@/lib/brandLandingEditorApi";
import { brandPortalUrl, centerPortalUrl } from "@/lib/brandPortalUrl";
import { getSupabase } from "@/lib/supabase";
import type { HomepageConfig } from "@/types/homepage";

type MarketingTab = "brand" | "center";

export function BrandMarketingEditorPage() {
  const { brandId, missingBrand } = useBrandScope();
  const qc = useQueryClient();
  const [tab, setTab] = useState<MarketingTab>("brand");
  const [brandConfig, setBrandConfig] = useState<HomepageConfig | null>(null);
  const [centerConfig, setCenterConfig] = useState<HomepageConfig | null>(null);
  const [saved, setSaved] = useState(false);

  const editor = useQuery({
    queryKey: ["brand-marketing-editor", brandId],
    enabled: !!brandId,
    queryFn: () => fetchBrandMarketingEditor(brandId!),
  });

  const previewCenter = useQuery({
    queryKey: ["brand-marketing-preview-center", brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from("franchise_centers")
        .select("slug")
        .eq("brand_id", brandId!)
        .is("deleted_at", null)
        .eq("status", "active")
        .order("created_at")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data?.slug ?? null;
    },
  });

  useEffect(() => {
    if (!editor.data) return;
    setBrandConfig(editor.data.landingConfig);
    setCenterConfig(editor.data.centerLandingConfig);
  }, [editor.data]);

  const save = useMutation({
    mutationFn: async () => {
      if (!brandId || !editor.data) throw new Error("Brand required");
      const key: BrandMarketingSettingsKey = tab === "brand" ? "landing" : "center_landing";
      const config = tab === "brand" ? brandConfig : centerConfig;
      if (!config) throw new Error("Config required");
      await saveBrandMarketingLanding(
        brandId,
        editor.data.settingsId,
        editor.data.existingSettings,
        key,
        config
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["brand-marketing-editor", brandId] });
      void qc.invalidateQueries({ queryKey: ["brand-landing"] });
      void qc.invalidateQueries({ queryKey: ["center-landing"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  if (missingBrand) {
    return <p className="ed-empty">Brand context not found.</p>;
  }

  if (editor.isLoading || !brandConfig || !centerConfig) {
    return <p>Loading marketing pages…</p>;
  }

  const brandSlug = editor.data?.brandSlug ?? "";
  const brandPreviewUrl = brandPortalUrl(brandSlug);
  const centerPreviewUrl =
    previewCenter.data && brandSlug ? centerPortalUrl(brandSlug, previewCenter.data) : null;
  const activeConfig = tab === "brand" ? brandConfig : centerConfig;
  const setActiveConfig = tab === "brand" ? setBrandConfig : setCenterConfig;

  return (
    <>
      <PageToolbar
        title="Marketing pages"
        subtitle={
          tab === "brand" ? (
            <>
              Franchise recruitment site ·{" "}
              <a href={brandPreviewUrl} target="_blank" rel="noreferrer">
                Preview brand site
              </a>
            </>
          ) : (
            <>
              Parent enrollment template for all centers ·{" "}
              {centerPreviewUrl ? (
                <a href={centerPreviewUrl} target="_blank" rel="noreferrer">
                  Preview center site
                </a>
              ) : (
                "Add an active center to preview"
              )}
            </>
          )
        }
      >
        <Button variant={tab === "brand" ? "primary" : "ghost"} onClick={() => setTab("brand")}>
          Brand site
        </Button>
        <Button variant={tab === "center" ? "primary" : "ghost"} onClick={() => setTab("center")}>
          Center sites
        </Button>
        <a href={tab === "brand" ? brandPreviewUrl : centerPreviewUrl ?? brandPreviewUrl} target="_blank" rel="noreferrer">
          <Button variant="ghost">Preview</Button>
        </a>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? "Saving…" : saved ? "Saved" : "Save changes"}
        </Button>
      </PageToolbar>

      {tab === "brand" && (
        <p className="ed-text-sm ed-muted" style={{ marginBottom: "1rem" }}>
          Testimonial quotes come from published{" "}
          <Link to="/app/success-stories">success stories</Link>. Edit the section title and subtitle below.
        </p>
      )}

      {tab === "center" && (
        <p className="ed-text-sm ed-muted" style={{ marginBottom: "1rem" }}>
          This template applies to every center hostname (e.g. koramangala.{brandSlug}.localhost). Center name and
          city are filled in automatically per location.
        </p>
      )}

      <HomepageEditorForm
        config={activeConfig}
        onChange={setActiveConfig}
        testimonialsManagedExternally={tab === "brand"}
        testimonialsExternalHint={
          tab === "brand" ? (
            <p className="ed-text-sm ed-muted">
              Manage quotes on the <Link to="/app/success-stories">Success stories</Link> page. Published stories
              replace the default testimonials on your live brand site.
            </p>
          ) : undefined
        }
      />
    </>
  );
}
