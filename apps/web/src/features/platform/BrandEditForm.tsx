import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button, FormGrid, Input, MutationError, PasswordInput, Select } from "@edunudg/ui";
import { BrandLogoUpload } from "@/features/brand/BrandLogoUpload";
import { fetchBrandOwnerLoginEmail, upsertBrandOwnerCredentials } from "@/lib/brandOwnerCredentialsApi";
import { updateBrandMarketingTheme } from "@/lib/brandLandingApi";
import { brandAdminPath } from "@/lib/adminPaths";
import { slugifyBrandName, uniqueBrandSlug } from "@/lib/brandSlug";
import { getSupabase } from "@/lib/supabase";
import { parseMarketingTheme, type MarketingTheme } from "@/types/homepage";
import { marketingThemeSelectOptions } from "./BrandMarketingThemesPanel";
import { useMutationError } from "./hooks/useMutationError";

type BrandStatus = "draft" | "active" | "suspended" | "archived";

const STATUS_OPTIONS: { value: BrandStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "archived", label: "Archived" },
];

type Props = {
  brandId: string;
  slug: string;
  name: string;
  status: BrandStatus;
  logoUrl: string | null;
  marketingTheme: string;
};

export function BrandEditForm({ brandId, slug, name, status, logoUrl, marketingTheme }: Props) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const savedTheme = parseMarketingTheme(marketingTheme);
  const [form, setForm] = useState({
    name,
    status,
    loginEmail: "",
    password: "",
    marketingTheme: savedTheme,
  });
  const [originalLoginEmail, setOriginalLoginEmail] = useState<string | null>(null);
  const [credentialsLoaded, setCredentialsLoaded] = useState(false);

  useEffect(() => {
    setForm((prev) => ({ ...prev, name, status, marketingTheme: parseMarketingTheme(marketingTheme) }));
  }, [name, status, marketingTheme]);

  useEffect(() => {
    let cancelled = false;
    setCredentialsLoaded(false);
    void (async () => {
      try {
        const loginEmail = (await fetchBrandOwnerLoginEmail(brandId)) ?? "";
        if (!cancelled) {
          setOriginalLoginEmail(loginEmail || null);
          setForm((prev) => ({ ...prev, loginEmail, password: "" }));
        }
      } catch {
        if (!cancelled) {
          setOriginalLoginEmail(null);
          setForm((prev) => ({ ...prev, loginEmail: "", password: "" }));
        }
      } finally {
        if (!cancelled) setCredentialsLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [brandId]);

  const nameLocked = status === "active";

  const saveBrand = useMutation({
    mutationFn: async () => {
      clear();
      const trimmedName = nameLocked ? name.trim() : form.name.trim();
      if (!nameLocked && !trimmedName) {
        throw new Error("Brand name is required");
      }

      // Active brands keep a stable slug/name so portal URLs and admin routes do not break.
      const nextSlug = nameLocked
        ? slug
        : trimmedName === name.trim()
          ? slug
          : await uniqueBrandSlug(trimmedName, { excludeBrandId: brandId });

      const { error: mErr } = await getSupabase()
        .from("brands")
        .update({
          slug: nextSlug,
          name: trimmedName,
          status: form.status,
        })
        .eq("id", brandId);
      if (mErr) throw mErr;

      if (form.marketingTheme !== savedTheme) {
        await updateBrandMarketingTheme(brandId, form.marketingTheme);
      }

      const loginEmail = form.loginEmail.trim();
      if (loginEmail) {
        if (!originalLoginEmail && !form.password.trim()) {
          throw new Error("Password required for a new brand login");
        }
        const { error: credErr } = await upsertBrandOwnerCredentials({
          brandId,
          email: loginEmail,
          password: form.password.trim() || undefined,
          fullName: trimmedName,
        });
        if (credErr) throw new Error(credErr);
      }

      return { slug: nextSlug };
    },
    onSuccess: (result) => {
      void qc.invalidateQueries({ queryKey: ["brands"] });
      void qc.invalidateQueries({ queryKey: ["brand"] });
      void qc.invalidateQueries({ queryKey: ["platform-stats"] });
      void qc.invalidateQueries({ queryKey: ["brand-landing"] });
      void qc.invalidateQueries({ queryKey: ["center-landing"] });
      setForm((prev) => ({ ...prev, password: "" }));
      if (result.slug !== slug) {
        navigate(brandAdminPath(result.slug), { replace: true });
      }
    },
    onError: capture,
  });

  const dirty =
    (!nameLocked && form.name.trim() !== name) ||
    form.status !== status ||
    form.marketingTheme !== savedTheme ||
    form.loginEmail.trim() !== (originalLoginEmail ?? "") ||
    Boolean(form.password.trim());

  const pendingSlug =
    !nameLocked && form.name.trim() !== name.trim() ? slugifyBrandName(form.name) : "";

  return (
    <div className="ed-editable-form">
      <MutationError message={error} />
      <FormGrid columns={3}>
        <Input
          label="Name"
          value={form.name}
          onChange={(v) => setForm((f) => ({ ...f, name: v }))}
          editable={!nameLocked}
          disabled={nameLocked}
        />
        <Select
          label="Status"
          value={form.status}
          onChange={(v) => setForm((f) => ({ ...f, status: v }))}
          options={STATUS_OPTIONS}
          editable
        />
        <BrandLogoUpload brandId={brandId} currentLogoUrl={logoUrl} editable />
        <Input
          label="Login email"
          value={form.loginEmail}
          onChange={(v) => setForm((f) => ({ ...f, loginEmail: v }))}
          type="email"
          editable
          disabled={!credentialsLoaded}
        />
        <PasswordInput
          label="Password"
          value={form.password}
          onChange={(v) => setForm((f) => ({ ...f, password: v }))}
          placeholder={originalLoginEmail ? "Leave blank to keep current password" : "Required for new login"}
          disabled={!credentialsLoaded}
        />
        <Select
          label="Website theme"
          value={form.marketingTheme}
          onChange={(v) => setForm((f) => ({ ...f, marketingTheme: parseMarketingTheme(v) as MarketingTheme }))}
          options={marketingThemeSelectOptions()}
          editable
        />
      </FormGrid>
      {nameLocked ? (
        <p className="ed-text-sm ed-muted" style={{ marginTop: "0.5rem" }}>
          Brand name is locked while status is Active so the portal URL slug stays stable.
        </p>
      ) : null}
      {pendingSlug && pendingSlug !== slug ? (
        <p className="ed-text-sm ed-muted" style={{ marginTop: "0.5rem" }}>
          Saving will update the brand URL slug to <code>{pendingSlug}</code>.
        </p>
      ) : null}
      <div style={{ marginTop: "0.75rem" }}>
        <Button
          onClick={() => saveBrand.mutate()}
          disabled={!form.name.trim() || saveBrand.isPending || !dirty}
        >
          {saveBrand.isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
