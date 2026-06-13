import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  FormGrid,
  Input,
  KpiCard,
  KpiGrid,
  MutationError,
  SaveButton,
  Select,
} from "@edunudg/ui";
import { centerPortalUrl } from "@/lib/brandPortalUrl";
import {
  type BrandCenterRow,
  fetchCenterStats,
  setFranchiseCenterStatus,
  updateFranchiseCenter,
} from "@/lib/centerCentersApi";
import type { CenterPublicProfileInput } from "@/lib/centerProfileFields";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { CenterPhotoUpload } from "@/features/center/settings/CenterPhotoUpload";
import { CenterCurriculumAuthPanel } from "./CenterCurriculumAuthPanel";
import "@/features/center/settings/centerSettings.css";

const SOCIAL_PLATFORMS = [
  "Facebook",
  "Instagram",
  "WhatsApp",
  "YouTube",
  "LinkedIn",
  "X (Twitter)",
];

const MAX_SOCIAL_LINKS = 6;

type FormState = CenterPublicProfileInput & { name: string };

function centerToForm(center: BrandCenterRow): FormState {
  return {
    name: center.name,
    displayName: center.display_name ?? "",
    shortDescription: center.short_description ?? "",
    addressLine1: center.address_line1 ?? "",
    city: center.city ?? "",
    region: center.region ?? "",
    pincode: center.pincode ?? "",
    country: center.country ?? "IN",
    contactPhone: center.contact_phone ?? "",
    photoUrl: center.photo_url ?? "",
    socialLinks:
      center.social_links.length > 0 ? center.social_links : [{ platform: "Facebook", url: "" }],
  };
}

type Props = {
  center: BrandCenterRow;
  brandId: string;
  brandSlug: string;
  onClose: () => void;
  onStatusChanged: () => void;
};

export function CenterDetailPanel({ center, brandId, brandSlug, onClose, onStatusChanged }: Props) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [form, setForm] = useState(() => centerToForm(center));
  const [suspendMode, setSuspendMode] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");

  useEffect(() => {
    setForm(centerToForm(center));
    setSuspendMode(false);
    setSuspendReason("");
  }, [center]);

  const stats = useQuery({
    queryKey: ["brand-center-stats", center.id],
    queryFn: () => fetchCenterStats(center.id),
  });

  const portalUrl = useMemo(
    () => (center.status === "active" ? centerPortalUrl(brandSlug, center.slug) : null),
    [brandSlug, center.slug, center.status]
  );

  const saveProfile = useMutation({
    mutationFn: async () => {
      clear();
      await updateFranchiseCenter(center.id, form);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["centers", brandId] });
    },
    onError: capture,
  });

  const suspend = useMutation({
    mutationFn: async () => {
      clear();
      await setFranchiseCenterStatus(center.id, "suspended", suspendReason);
    },
    onSuccess: () => {
      setSuspendMode(false);
      onStatusChanged();
    },
    onError: capture,
  });

  const reEnable = useMutation({
    mutationFn: async () => {
      clear();
      await setFranchiseCenterStatus(center.id, "active");
    },
    onSuccess: onStatusChanged,
    onError: capture,
  });

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateSocial = (index: number, patch: Partial<{ platform: string; url: string }>) => {
    setForm((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.map((link, i) => (i === index ? { ...link, ...patch } : link)),
    }));
  };

  const addSocial = () => {
    if (form.socialLinks.length >= MAX_SOCIAL_LINKS) return;
    setForm((prev) => ({
      ...prev,
      socialLinks: [...prev.socialLinks, { platform: "Instagram", url: "" }],
    }));
  };

  const removeSocial = (index: number) => {
    setForm((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== index),
    }));
  };

  const title = center.display_name ?? center.name;

  return (
    <Card title="Franchise detail">
      <div className="ed-ops-detail-enter ed-inquiry-detail">
        <div className="ed-inquiry-detail__header">
          <div>
            <h3 className="ed-inquiry-detail__title">{title}</h3>
            <p className="ed-text-sm ed-muted">
              Slug: {center.slug} (read-only)
              {center.city ? ` · ${center.city}` : ""}
            </p>
          </div>
          <Badge tone={center.status === "active" ? "success" : center.status === "suspended" ? "warning" : "default"}>
            {center.status}
          </Badge>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          {portalUrl && (
            <Button variant="ghost" onClick={() => window.open(portalUrl, "_blank", "noopener,noreferrer")}>
              Open center site
            </Button>
          )}
        </div>

        <KpiGrid>
          <KpiCard label="Open leads" value={stats.data?.openLeads ?? "—"} />
          <KpiCard label="Students enrolled" value={stats.data?.students ?? "—"} />
          <KpiCard label="Active enrollments" value={stats.data?.activeEnrollments ?? "—"} />
        </KpiGrid>

        <MutationError message={error} />

        <section style={{ marginTop: "1rem" }}>
          <h4 className="ed-text-sm" style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
            Profile
          </h4>
          <CenterPhotoUpload
            brandId={brandId}
            centerId={center.id}
            currentPhotoUrl={form.photoUrl}
            onUploaded={(url) => setField("photoUrl", url)}
            disabled={saveProfile.isPending}
          />
          <FormGrid>
            <Input label="Franchise name" value={form.name} onChange={(v) => setField("name", v)} editable />
            <Input
              label="Display name"
              value={form.displayName}
              onChange={(v) => setField("displayName", v)}
              placeholder={center.name}
              editable
            />
            <Input
              label="Short description"
              value={form.shortDescription}
              onChange={(v) => setField("shortDescription", v)}
              editable
            />
            <Input label="Address" value={form.addressLine1} onChange={(v) => setField("addressLine1", v)} editable />
            <Input label="City" value={form.city} onChange={(v) => setField("city", v)} editable />
            <Input label="Region" value={form.region} onChange={(v) => setField("region", v)} editable />
            <Input label="Pincode" value={form.pincode} onChange={(v) => setField("pincode", v)} editable />
            <Input label="Country" value={form.country} onChange={(v) => setField("country", v)} editable />
            <Input
              label="Phone / WhatsApp"
              value={form.contactPhone}
              onChange={(v) => setField("contactPhone", v)}
              editable
            />
          </FormGrid>

          <div className="ed-center-social-links">
            <p className="ed-field__label">Social media</p>
            {form.socialLinks.map((link, index) => (
              <div key={`social-${index}`} className="ed-center-social-links__row">
                <Select
                  label="Platform"
                  value={link.platform}
                  onChange={(platform) => updateSocial(index, { platform })}
                  options={SOCIAL_PLATFORMS.map((p) => ({ value: p, label: p }))}
                  editable
                />
                <Input
                  label="Profile URL"
                  value={link.url}
                  onChange={(url) => updateSocial(index, { url })}
                  editable
                />
                <Button variant="ghost" onClick={() => removeSocial(index)} disabled={form.socialLinks.length <= 1}>
                  Remove
                </Button>
              </div>
            ))}
            <Button variant="ghost" onClick={addSocial} disabled={form.socialLinks.length >= MAX_SOCIAL_LINKS}>
              Add social link
            </Button>
          </div>

          <SaveButton
            onClick={() => saveProfile.mutate()}
            disabled={!form.name.trim() || saveProfile.isPending}
            pending={saveProfile.isPending}
            label="Save profile"
          />
        </section>

        <section style={{ marginTop: "1.25rem" }}>
          <h4 className="ed-text-sm" style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
            Curriculum assignment
          </h4>
          <CenterCurriculumAuthPanel centerId={center.id} centerName={title} brandId={brandId} />
        </section>

        <section style={{ marginTop: "1.25rem" }}>
          <h4 className="ed-text-sm" style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
            Lifecycle
          </h4>
          {center.status === "active" && !suspendMode && (
            <Button variant="ghost" onClick={() => setSuspendMode(true)}>
              Suspend franchise
            </Button>
          )}
          {suspendMode && (
            <div className="ed-ops-animate-in">
              <p className="ed-text-sm ed-muted">
                Suspending blocks center staff from /app and hides public registration. You can re-enable later.
              </p>
              <Input
                label="Reason (optional)"
                value={suspendReason}
                onChange={setSuspendReason}
                editable
              />
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                <Button onClick={() => suspend.mutate()} disabled={suspend.isPending}>
                  {suspend.isPending ? "Suspending…" : "Confirm suspend"}
                </Button>
                <Button variant="ghost" onClick={() => setSuspendMode(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
          {center.status === "suspended" && (
            <Button onClick={() => reEnable.mutate()} disabled={reEnable.isPending}>
              {reEnable.isPending ? "Re-enabling…" : "Re-enable franchise"}
            </Button>
          )}
        </section>
      </div>
    </Card>
  );
}
