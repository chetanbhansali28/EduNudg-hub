import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HomepageEditorForm } from "@/features/marketing/HomepageEditorForm";
import { HomepageEditorPanel, HomepageEditorShell } from "@/features/marketing/HomepageEditorShell";
import { useBrandScope } from "@/features/brand/hooks/useBrandScope";
import { fetchBrandMarketingEditor, saveBrandMarketingLanding } from "@/lib/brandLandingEditorApi";
import { brandPortalUrl, centerPortalUrl } from "@/lib/brandPortalUrl";
import { getSupabase } from "@/lib/supabase";
import type { HomepageConfig } from "@/types/homepage";

export function BrandMarketingEditorPage() {
  const { brandId, missingBrand } = useBrandScope();
  const qc = useQueryClient();
  const [brandConfig, setBrandConfig] = useState<HomepageConfig | null>(null);
  const [centerConfig, setCenterConfig] = useState<HomepageConfig | null>(null);
  const [brandSaved, setBrandSaved] = useState(false);
  const [centerSaved, setCenterSaved] = useState(false);

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

  const saveBrand = useMutation({
    mutationFn: async () => {
      if (!brandId || !editor.data || !brandConfig) throw new Error("Brand required");
      await saveBrandMarketingLanding(
        brandId,
        editor.data.settingsId,
        editor.data.existingSettings,
        "landing",
        brandConfig
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["brand-marketing-editor", brandId] });
      void qc.invalidateQueries({ queryKey: ["brand-landing"] });
      setBrandSaved(true);
      setTimeout(() => setBrandSaved(false), 3000);
    },
  });

  const saveCenter = useMutation({
    mutationFn: async () => {
      if (!brandId || !editor.data || !centerConfig) throw new Error("Brand required");
      await saveBrandMarketingLanding(
        brandId,
        editor.data.settingsId,
        editor.data.existingSettings,
        "center_landing",
        centerConfig
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["brand-marketing-editor", brandId] });
      void qc.invalidateQueries({ queryKey: ["center-landing"] });
      setCenterSaved(true);
      setTimeout(() => setCenterSaved(false), 3000);
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

  return (
    <HomepageEditorShell
      title="Marketing pages"
      subtitle="Edit your brand recruitment site and center enrollment template."
    >
      <div className="ed-homepage-editor-pages">
        <HomepageEditorPanel
          title="Brand site (franchise recruitment)"
          saveLabel="Save brand site"
          onSave={() => saveBrand.mutate()}
          savePending={saveBrand.isPending}
          saved={brandSaved}
          description={
            <>
              Public homepage on your brand hostname ·{" "}
              <a href={brandPreviewUrl} target="_blank" rel="noreferrer">
                Preview
              </a>
              . Testimonial quotes come from published{" "}
              <Link to="/app/success-stories">success stories</Link>.
            </>
          }
        >
          <HomepageEditorForm
            config={brandConfig}
            onChange={setBrandConfig}
            uploadScope={{ kind: "brand", brandId: brandId! }}
            testimonialsManagedExternally
            testimonialsExternalHint={
              <p className="ed-text-sm ed-muted">
                Manage quotes on the <Link to="/app/success-stories">Success stories</Link> page.
              </p>
            }
          />
        </HomepageEditorPanel>

        <HomepageEditorPanel
          title="Center sites (parent enrollment template)"
          saveLabel="Save center template"
          onSave={() => saveCenter.mutate()}
          savePending={saveCenter.isPending}
          saved={centerSaved}
          description={
            <>
              Template for every center hostname (e.g. koramangala.{brandSlug}.localhost). Center name and city are
              filled in per location.{" "}
              {centerPreviewUrl ? (
                <a href={centerPreviewUrl} target="_blank" rel="noreferrer">
                  Preview center site
                </a>
              ) : (
                "Add an active center to preview."
              )}
            </>
          }
        >
          <HomepageEditorForm
            config={centerConfig}
            onChange={setCenterConfig}
            uploadScope={{ kind: "brand", brandId: brandId! }}
          />
        </HomepageEditorPanel>
      </div>
    </HomepageEditorShell>
  );
}
