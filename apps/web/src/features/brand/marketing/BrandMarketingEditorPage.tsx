import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, PageTitle } from "@edunudg/ui";
import { HomepageEditorForm } from "@/features/marketing/HomepageEditorForm";
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
    <>
      <PageTitle>Marketing pages</PageTitle>

      <Card title="Brand site (franchise recruitment)">
        <p className="ed-text-sm ed-muted">
          Public homepage on your brand hostname ·{" "}
          <a href={brandPreviewUrl} target="_blank" rel="noreferrer">
            Preview
          </a>
          . Testimonial quotes come from published{" "}
          <Link to="/app/success-stories">success stories</Link>.
        </p>
        <HomepageEditorForm
          config={brandConfig}
          onChange={setBrandConfig}
          testimonialsManagedExternally
          testimonialsExternalHint={
            <p className="ed-text-sm ed-muted">
              Manage quotes on the <Link to="/app/success-stories">Success stories</Link> page.
            </p>
          }
        />
        <Button onClick={() => saveBrand.mutate()} disabled={saveBrand.isPending}>
          {saveBrand.isPending ? "Saving…" : brandSaved ? "Saved" : "Save brand site"}
        </Button>
      </Card>

      <Card title="Center sites (parent enrollment template)">
        <p className="ed-text-sm ed-muted">
          Template for every center hostname (e.g. koramangala.{brandSlug}.localhost). Center name and city are filled
          in per location.{" "}
          {centerPreviewUrl ? (
            <a href={centerPreviewUrl} target="_blank" rel="noreferrer">
              Preview center site
            </a>
          ) : (
            "Add an active center to preview."
          )}
        </p>
        <HomepageEditorForm config={centerConfig} onChange={setCenterConfig} />
        <Button onClick={() => saveCenter.mutate()} disabled={saveCenter.isPending}>
          {saveCenter.isPending ? "Saving…" : centerSaved ? "Saved" : "Save center template"}
        </Button>
      </Card>
    </>
  );
}
