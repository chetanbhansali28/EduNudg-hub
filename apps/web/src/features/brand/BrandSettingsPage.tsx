import { useBrandScope } from "@/features/brand/hooks/useBrandScope";
import { BrandFeatureTogglesCard } from "@/features/brand/settings/BrandFeatureTogglesCard";
import { BrandLogoUpload } from "./BrandLogoUpload";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, Input, MutationError, PageToolbar, SaveButton } from "@edunudg/ui";
import { getSupabase } from "@/lib/supabase";
import { supabaseMaybe } from "@/lib/supabaseResult";
import { useMutationError } from "@/features/platform/hooks/useMutationError";

function useSavedFlash() {
  const [saved, setSaved] = useState(false);
  const flash = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 3000);
  };
  return { saved, flash };
}

export function BrandSettingsPage() {
  const { brandId, missingBrand } = useBrandScope();
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const loginSaved = useSavedFlash();
  const slaSaved = useSavedFlash();
  const themeSaved = useSavedFlash();

  const [loginHeadline, setLoginHeadline] = useState("");
  const [loginSubtext, setLoginSubtext] = useState("");
  const [leadStaleDays, setLeadStaleDays] = useState("15");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [primaryColor, setPrimaryColor] = useState("#2563eb");

  const settings = useQuery({
    queryKey: ["brand-settings", brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("brand_settings")
        .select("id, settings")
        .eq("brand_id", brandId!)
        .maybeSingle();
      return supabaseMaybe(data, qErr) as { id: string; settings: Record<string, unknown> } | null;
    },
  });

  const theme = useQuery({
    queryKey: ["brand-theme", brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("brand_themes")
        .select("id, tokens")
        .eq("brand_id", brandId!)
        .maybeSingle();
      return supabaseMaybe(data, qErr) as { id: string; tokens: Record<string, string> } | null;
    },
  });

  const brandRow = useQuery({
    queryKey: ["brand-row", brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("brands")
        .select("id, logo_url")
        .eq("id", brandId!)
        .maybeSingle();
      return supabaseMaybe(data, qErr) as { id: string; logo_url: string | null } | null;
    },
  });

  useEffect(() => {
    const s = settings.data?.settings ?? {};
    setLoginHeadline(String(s.login_headline ?? ""));
    setLoginSubtext(String(s.login_subtext ?? ""));
    setLeadStaleDays(String(s.lead_stale_days ?? 15));
    setTimezone(String(s.timezone ?? "Asia/Kolkata"));
  }, [settings.data]);

  useEffect(() => {
    setPrimaryColor(theme.data?.tokens?.primary ?? "#2563eb");
  }, [theme.data]);

  const saveSettings = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      if (!brandId) throw new Error("Brand required");
      clear();
      const merged = { ...(settings.data?.settings ?? {}), ...patch };
      if (settings.data?.id) {
        const { error: mErr } = await getSupabase()
          .from("brand_settings")
          .update({ settings: merged })
          .eq("id", settings.data.id);
        if (mErr) throw mErr;
      } else {
        const { error: mErr } = await getSupabase()
          .from("brand_settings")
          .insert({ brand_id: brandId, settings: merged });
        if (mErr) throw mErr;
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["brand-settings", brandId] });
      void qc.invalidateQueries({ queryKey: ["brand-features", brandId] });
    },
    onError: capture,
  });

  const saveTheme = useMutation({
    mutationFn: async () => {
      if (!brandId) throw new Error("Brand required");
      clear();
      const tokens = { ...(theme.data?.tokens ?? {}), primary: primaryColor.trim() };
      if (theme.data?.id) {
        const { error: mErr } = await getSupabase().from("brand_themes").update({ tokens }).eq("id", theme.data.id);
        if (mErr) throw mErr;
      } else {
        const { error: mErr } = await getSupabase().from("brand_themes").insert({ brand_id: brandId, tokens });
        if (mErr) throw mErr;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brand-theme", brandId] }),
    onError: capture,
  });

  if (missingBrand) {
    return <p className="ed-empty">Brand context not found.</p>;
  }

  const staleDaysNum = parseInt(leadStaleDays, 10);

  return (
    <>
      <PageToolbar title="Brand Settings" />
      <MutationError message={error} />

      <Card title="Brand logo">
        <BrandLogoUpload brandId={brandId} currentLogoUrl={brandRow.data?.logo_url} />
      </Card>

      <Card
        title="White-label & login copy"
        actions={
          <SaveButton
            onClick={() =>
              saveSettings.mutate(
                {
                  login_headline: loginHeadline.trim() || null,
                  login_subtext: loginSubtext.trim() || null,
                },
                { onSuccess: () => loginSaved.flash() }
              )
            }
            pending={saveSettings.isPending}
            saved={loginSaved.saved}
          />
        }
      >
        <Input label="Login headline" value={loginHeadline} onChange={setLoginHeadline} />
        <Input label="Login subtext" value={loginSubtext} onChange={setLoginSubtext} />
      </Card>

      <Card
        title="Lead SLA & timezone"
        actions={
          <SaveButton
            onClick={() =>
              saveSettings.mutate(
                {
                  lead_stale_days: Number.isFinite(staleDaysNum) && staleDaysNum > 0 ? staleDaysNum : 15,
                  timezone: timezone.trim() || "Asia/Kolkata",
                },
                { onSuccess: () => slaSaved.flash() }
              )
            }
            pending={saveSettings.isPending}
            saved={slaSaved.saved}
          />
        }
      >
        <Input
          label="Stale lead days after assign"
          value={leadStaleDays}
          onChange={setLeadStaleDays}
          placeholder="15"
        />
        <Input label="Timezone (IANA)" value={timezone} onChange={setTimezone} placeholder="Asia/Kolkata" />
      </Card>

      {brandId && settings.data && (
        <BrandFeatureTogglesCard
          brandId={brandId}
          settingsId={settings.data.id}
          settings={settings.data.settings}
          onSaved={() => {
            void qc.invalidateQueries({ queryKey: ["brand-settings", brandId] });
            void qc.invalidateQueries({ queryKey: ["brand-features", brandId] });
          }}
        />
      )}

      <Card
        title="Theme"
        actions={
          <SaveButton
            onClick={() => saveTheme.mutate(undefined, { onSuccess: () => themeSaved.flash() })}
            pending={saveTheme.isPending}
            saved={themeSaved.saved}
          />
        }
      >
        <Input label="Primary color" value={primaryColor} onChange={setPrimaryColor} placeholder="#2563eb" />
      </Card>
    </>
  );
}
