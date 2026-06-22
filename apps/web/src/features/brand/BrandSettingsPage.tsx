import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Input, MutationError, SaveButton, Select, Textarea } from "@edunudg/ui";
import { useBrandScope } from "@/features/brand/hooks/useBrandScope";
import { BrandLogoUpload } from "@/features/brand/BrandLogoUpload";
import { useOpsBreakpoint } from "@/features/center/hooks/useOpsBreakpoint";
import { getSupabase } from "@/lib/supabase";
import { supabaseMaybe } from "@/lib/supabaseResult";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { BrandLegalDocumentsSection } from "@/features/brand/settings/BrandLegalDocumentsSection";
import {
  BRAND_TIMEZONE_OPTIONS,
  formatSettingsUpdated,
  normalizeStaleLeadDays,
  parseLegalDocuments,
  type LegalDocument,
} from "@/features/brand/settings/brandSettingsHelpers";
import "./settings/brandSettings.css";

function useSavedFlash() {
  const [saved, setSaved] = useState(false);
  const flash = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 3000);
  };
  return { saved, flash };
}

const ICON_BRUSH = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
    <path d="m14.5 3.5 4 4L8 18l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const ICON_TAG = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    <circle cx="12" cy="12" r="1.5" />
  </svg>
);

const ICON_CLOCK = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const ICON_GEAR = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

export function BrandSettingsPage() {
  const { brandId, missingBrand } = useBrandScope();
  const { isDesktop, isMobile } = useOpsBreakpoint();
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const loginSaved = useSavedFlash();
  const slaSaved = useSavedFlash();
  const legalSaved = useSavedFlash();
  const mobileSaved = useSavedFlash();

  const [loginHeadline, setLoginHeadline] = useState("");
  const [loginSubtext, setLoginSubtext] = useState("");
  const [leadStaleDays, setLeadStaleDays] = useState("15");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [legalDocuments, setLegalDocuments] = useState<LegalDocument[]>([]);

  const settings = useQuery({
    queryKey: ["brand-settings", brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("brand_settings")
        .select("id, settings, updated_at")
        .eq("brand_id", brandId!)
        .maybeSingle();
      return supabaseMaybe(data, qErr) as {
        id: string;
        settings: Record<string, unknown>;
        updated_at: string;
      } | null;
    },
  });

  const brandRow = useQuery({
    queryKey: ["brand-row", brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("brands")
        .select("id, logo_url, name")
        .eq("id", brandId!)
        .maybeSingle();
      return supabaseMaybe(data, qErr) as { id: string; logo_url: string | null; name: string } | null;
    },
  });

  useEffect(() => {
    const s = settings.data?.settings ?? {};
    setLoginHeadline(String(s.login_headline ?? ""));
    setLoginSubtext(String(s.login_subtext ?? ""));
    setLeadStaleDays(String(s.lead_stale_days ?? 15));
    setTimezone(String(s.timezone ?? "Asia/Kolkata"));
    setLegalDocuments(parseLegalDocuments(s));
  }, [settings.data]);

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

  if (missingBrand) {
    return <p className="ed-empty">Brand context not found.</p>;
  }

  const brandName = brandRow.data?.name ?? "your brand";
  const updatedLabel = formatSettingsUpdated(settings.data?.updated_at);

  const timezoneOptions = useMemo(() => {
    const options: { value: string; label: string }[] = BRAND_TIMEZONE_OPTIONS.map((option) => ({
      value: option.value,
      label: option.label,
    }));
    if (timezone && !options.some((option) => option.value === timezone)) {
      options.push({ value: timezone, label: timezone });
    }
    return options;
  }, [timezone]);

  const saveLoginCopy = () =>
    saveSettings.mutate(
      {
        login_headline: loginHeadline.trim() || null,
        login_subtext: loginSubtext.trim() || null,
      },
      { onSuccess: () => loginSaved.flash() }
    );

  const saveRegional = () =>
    saveSettings.mutate(
      {
        lead_stale_days: normalizeStaleLeadDays(leadStaleDays),
        timezone: timezone.trim() || "Asia/Kolkata",
      },
      { onSuccess: () => slaSaved.flash() }
    );

  const saveLegal = () =>
    saveSettings.mutate({ legal_documents: legalDocuments }, { onSuccess: () => legalSaved.flash() });

  const saveAllMobile = () =>
    saveSettings.mutate(
      {
        login_headline: loginHeadline.trim() || null,
        login_subtext: loginSubtext.trim() || null,
        lead_stale_days: normalizeStaleLeadDays(leadStaleDays),
        timezone: timezone.trim() || "Asia/Kolkata",
        legal_documents: legalDocuments,
      },
      { onSuccess: () => mobileSaved.flash() }
    );

  return (
    <div className="ed-brand-settings-page">
      {isDesktop ? (
        <>
          <nav className="ed-brand-settings-page__breadcrumbs" aria-label="Breadcrumb">
            <Link to="/app">Admin</Link>
            <span aria-hidden>›</span>
            <span>Brand Settings</span>
          </nav>
          <div className="ed-brand-settings-page__title-row">
            <h1 className="ed-brand-settings-page__title">Brand Configuration</h1>
            <span className="ed-brand-settings-page__entity-badge">Active Entity: {brandName}</span>
          </div>
        </>
      ) : (
        <div className="ed-brand-settings-page__mobile-intro">
          <h1 className="ed-brand-settings-page__title">Brand Settings</h1>
          <p className="ed-brand-settings-page__mobile-subtitle">
            Configure how your EduNudge platform appears and functions for your franchises.
          </p>
        </div>
      )}

      <MutationError message={error} />

      <div className="ed-brand-settings-page__grid">
        <section className="ed-brand-settings-card">
          <div className="ed-brand-settings-card__mobile-label">{ICON_BRUSH} Brand Identity</div>
          <header className="ed-brand-settings-card__head">
            <div>
              <h2 className="ed-brand-settings-card__title">Brand Identity</h2>
              <p className="ed-brand-settings-card__subtitle">
                Update your public facing logo and franchise identity.
              </p>
            </div>
          </header>
          <BrandLogoUpload
            brandId={brandId}
            currentLogoUrl={brandRow.data?.logo_url}
            brandDisplayName={brandName}
            variant="settings"
          />
        </section>

        <div className="ed-brand-settings-page__grid-col">
          <section className="ed-brand-settings-card">
            <div className="ed-brand-settings-card__mobile-label">{ICON_TAG} White-label Copy</div>
            <header className="ed-brand-settings-card__head">
              <div>
                <h2 className="ed-brand-settings-card__title">White-label &amp; Login Copy</h2>
                <p className="ed-brand-settings-card__subtitle">
                  Customize the messaging for the student and admin login screens.
                </p>
              </div>
              <span className="ed-brand-settings-card__head-icon ed-brand-settings-card__head-icon--corner">
                {ICON_BRUSH}
              </span>
            </header>
            <div className="ed-brand-settings-fields">
              <div className="ed-brand-settings-field">
                <Input label="Login headline" value={loginHeadline} onChange={setLoginHeadline} />
              </div>
              <div className="ed-brand-settings-field">
                <Textarea label="Login subtext" value={loginSubtext} onChange={setLoginSubtext} rows={4} />
              </div>
            </div>
            {isDesktop ? (
              <footer className="ed-brand-settings-card__footer ed-brand-settings-card__footer--end ed-brand-settings-card__footer--desktop-only">
                <SaveButton
                  onClick={saveLoginCopy}
                  pending={saveSettings.isPending}
                  saved={loginSaved.saved}
                  label="Save Copy"
                />
              </footer>
            ) : null}
          </section>

          <section className="ed-brand-settings-card">
            <div className="ed-brand-settings-card__mobile-label">{ICON_GEAR} Operational Defaults</div>
            <header className="ed-brand-settings-card__head ed-brand-settings-card__head--with-icon">
              <span className="ed-brand-settings-card__head-icon">{ICON_CLOCK}</span>
              <div>
                <h2 className="ed-brand-settings-card__title">Lead SLA &amp; Timezone</h2>
                <p className="ed-brand-settings-card__subtitle">
                  Configure automated lead management and regional standards.
                </p>
              </div>
            </header>
            <div className="ed-brand-settings-fields ed-brand-settings-fields--split">
              <div className="ed-brand-settings-field">
                <Input
                  label={isMobile ? "Stale Lead Threshold (Days)" : "Stale lead days after assign"}
                  value={leadStaleDays}
                  onChange={setLeadStaleDays}
                  placeholder="15"
                />
                {isMobile ? (
                  <p className="ed-brand-settings-suffix-input__label">Days of Inactivity</p>
                ) : null}
              </div>
              <div className="ed-brand-settings-field">
                <Select
                  label={isMobile ? "Primary Timezone" : "Timezone (IANA)"}
                  value={timezone}
                  onChange={setTimezone}
                  options={timezoneOptions}
                />
              </div>
            </div>
            {isDesktop ? (
              <footer className="ed-brand-settings-card__footer ed-brand-settings-card__footer--desktop-only">
                {updatedLabel ? <span className="ed-brand-settings-card__status">✓ {updatedLabel}</span> : <span />}
                <SaveButton
                  onClick={saveRegional}
                  pending={saveSettings.isPending}
                  saved={slaSaved.saved}
                  label="Save Regional Settings"
                />
              </footer>
            ) : null}
          </section>
        </div>

        <BrandLegalDocumentsSection
          brandId={brandId}
          documents={legalDocuments}
          onDocumentsChange={setLegalDocuments}
          onPersist={saveLegal}
          persistPending={saveSettings.isPending}
          persistSaved={legalSaved.saved}
          showDesktopSave={isDesktop}
        />
      </div>

      {isDesktop ? <p className="ed-brand-settings-page__footer">© 2024 EduNudge Platform v2.4.1</p> : null}

      {isMobile ? (
        <div className="ed-brand-settings-page__mobile-save">
          <SaveButton
            onClick={saveAllMobile}
            pending={saveSettings.isPending}
            saved={mobileSaved.saved}
            label="Save Changes"
            block
          />
        </div>
      ) : null}
    </div>
  );
}
