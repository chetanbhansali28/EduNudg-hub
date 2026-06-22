import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  CenterAddSocialButton,
  CenterCurriculumToggleCard,
  CenterDetailFooter,
  CenterDetailHero,
  CenterDetailStatsRow,
  CenterMobileHeroBanner,
  CentersSectionCard,
  CenterSocialLinkRow,
  CenterStatusBadge,
  FormGrid,
  Input,
  MutationError,
  SaveButton,
  Select,
  Textarea,
} from "@edunudg/ui";
import { portalBackendUrl } from "@/lib/brandPortalUrl";
import {
  type BrandCenterRow,
  fetchCenterStats,
  setFranchiseCenterStatus,
  updateFranchiseCenter,
} from "@/lib/centerCentersApi";
import type { CenterPublicProfileInput } from "@/lib/centerProfileFields";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import {
  fetchCenterAuthorizedProgramIds,
  setCenterCourseAuthorized,
} from "@/lib/centerCurriculumApi";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { CenterPhotoUpload } from "@/features/center/settings/CenterPhotoUpload";
import {
  centerFranchiseId,
  centerInitials,
  centerListTitle,
  centerStatsItems,
  centerStatusTone,
  programCurriculumSubtitle,
} from "@/features/brand/centers/brandCentersHelpers";

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
  isMobile: boolean;
  onStatusChanged: () => void;
};

export function CenterDetailPanel({ center, brandId, brandSlug, isMobile, onStatusChanged }: Props) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [form, setForm] = useState(() => centerToForm(center));
  const [savedForm, setSavedForm] = useState(() => centerToForm(center));
  const [suspendMode, setSuspendMode] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [pendingProgramId, setPendingProgramId] = useState<string | null>(null);

  useEffect(() => {
    const next = centerToForm(center);
    setForm(next);
    setSavedForm(next);
    setSuspendMode(false);
    setSuspendReason("");
  }, [center]);

  const stats = useQuery({
    queryKey: ["brand-center-stats", center.id],
    queryFn: () => fetchCenterStats(center.id),
  });

  const programs = useQuery({
    queryKey: ["brand-programs-for-auth", brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("programs")
        .select("id, name, age_label, description")
        .eq("brand_id", brandId)
        .is("deleted_at", null)
        .order("name");
      return supabaseList(data, qErr) as {
        id: string;
        name: string;
        age_label: string | null;
        description: string | null;
      }[];
    },
  });

  const authorizedProgramIds = useQuery({
    queryKey: ["center-program-auth", center.id],
    queryFn: () => fetchCenterAuthorizedProgramIds(center.id),
  });

  const authorizedSet = new Set(authorizedProgramIds.data ?? []);
  const title = centerListTitle(center);
  const initials = centerInitials(center);
  const centerBackendUrl =
    center.status === "active"
      ? portalBackendUrl({ portalType: "center", brandSlug, centerSlug: center.slug })
      : null;
  const isDirty = JSON.stringify(form) !== JSON.stringify(savedForm);

  const saveProfile = useMutation({
    mutationFn: async () => {
      clear();
      await updateFranchiseCenter(center.id, form);
    },
    onSuccess: () => {
      setSavedForm(form);
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

  const toggleProgram = useMutation({
    mutationFn: async ({ programId, enabled }: { programId: string; enabled: boolean }) => {
      clear();
      setPendingProgramId(programId);
      await setCenterCourseAuthorized(center.id, brandId, programId, enabled);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["center-program-auth", center.id] });
      void qc.invalidateQueries({ queryKey: ["authorized-programs", center.id] });
      void qc.invalidateQueries({ queryKey: ["course-impact"] });
    },
    onError: capture,
    onSettled: () => setPendingProgramId(null),
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

  const resetForm = () => setForm(savedForm);

  const heroActions = (
    <>
      {centerBackendUrl ? (
        <Button
          variant="secondary"
          onClick={() => window.open(`${centerBackendUrl}/students`, "_blank", "noopener,noreferrer")}
        >
          View Students
        </Button>
      ) : (
        <Button variant="secondary" disabled>
          View Students
        </Button>
      )}
      {centerBackendUrl ? (
        <Button onClick={() => window.open(centerBackendUrl, "_blank", "noopener,noreferrer")}>
          Assign Faculty
        </Button>
      ) : (
        <Button disabled>Assign Faculty</Button>
      )}
    </>
  );

  return (
    <div className={`ed-brand-centers__detail${isMobile ? " ed-brand-centers__detail--mobile" : ""}`}>
      {isMobile ? (
        <CenterMobileHeroBanner
          initials={initials}
          imageUrl={form.photoUrl}
          title={title}
          slug={center.slug}
        />
      ) : (
        <CenterDetailHero
          initials={initials}
          imageUrl={form.photoUrl}
          title={title}
          franchiseId={centerFranchiseId(center)}
          status={<CenterStatusBadge status={centerStatusTone(center.status)} />}
          actions={heroActions}
        />
      )}

      {stats.data ? <CenterDetailStatsRow items={centerStatsItems(stats.data)} /> : null}

      <MutationError message={error} />

      {!isMobile ? null : (
        <div className="ed-brand-centers__mobile-photo">
          <CenterPhotoUpload
            brandId={brandId}
            centerId={center.id}
            currentPhotoUrl={form.photoUrl}
            onUploaded={(url) => setField("photoUrl", url)}
            disabled={saveProfile.isPending}
          />
        </div>
      )}

      <CentersSectionCard title="Franchise Identity">
        {!isMobile ? (
          <CenterPhotoUpload
            brandId={brandId}
            centerId={center.id}
            currentPhotoUrl={form.photoUrl}
            onUploaded={(url) => setField("photoUrl", url)}
            disabled={saveProfile.isPending}
          />
        ) : null}
        <FormGrid columns={isMobile ? 1 : 2}>
          <Input label="Franchise Name" value={form.name} onChange={(v) => setField("name", v)} editable />
          <Input
            label="Display Name"
            value={form.displayName}
            onChange={(v) => setField("displayName", v)}
            placeholder={center.name}
            editable
          />
        </FormGrid>
        <Textarea
          label="Short Description"
          value={form.shortDescription}
          onChange={(v) => setField("shortDescription", v)}
          rows={3}
          editable
        />
      </CentersSectionCard>

      <CentersSectionCard title="Location & Contact">
        <FormGrid columns={2}>
          <Input label="City" value={form.city} onChange={(v) => setField("city", v)} editable />
          <Input label="Region" value={form.region} onChange={(v) => setField("region", v)} editable />
          <Input label="Pincode" value={form.pincode} onChange={(v) => setField("pincode", v)} editable />
          <Input label="Country" value={form.country} onChange={(v) => setField("country", v)} editable />
        </FormGrid>
        <Input
          label="Contact Phone"
          value={form.contactPhone}
          onChange={(v) => setField("contactPhone", v)}
          editable
        />
        {!isMobile ? (
          <Input label="Address" value={form.addressLine1} onChange={(v) => setField("addressLine1", v)} editable />
        ) : null}
      </CentersSectionCard>

      <CentersSectionCard
        title="Social Media"
        action={
          <button type="button" className="ed-centers-section__link" onClick={addSocial} disabled={form.socialLinks.length >= MAX_SOCIAL_LINKS}>
            + Add Link
          </button>
        }
      >
        {form.socialLinks.map((link, index) => (
          <div key={`social-${index}`} className="ed-brand-centers__social-block">
            <Select
              label="Platform"
              value={link.platform}
              onChange={(platform) => updateSocial(index, { platform })}
              options={SOCIAL_PLATFORMS.map((p) => ({ value: p, label: p }))}
              editable
            />
            <CenterSocialLinkRow
              value={link.url}
              onChange={(url) => updateSocial(index, { url })}
              onRemove={form.socialLinks.length > 1 ? () => removeSocial(index) : undefined}
            />
          </div>
        ))}
        {isMobile ? <CenterAddSocialButton onClick={addSocial} /> : null}
      </CentersSectionCard>

      <CentersSectionCard title="Curriculum Assignment">
        {programs.isLoading || authorizedProgramIds.isLoading ? (
          <p className="ed-text-sm ed-muted">Loading curriculum…</p>
        ) : (programs.data ?? []).length === 0 ? (
          <p className="ed-text-sm ed-muted">
            Create a course on the Curriculum page before assigning it to franchises.
          </p>
        ) : (
          (programs.data ?? []).map((course) => {
            const checked = authorizedSet.has(course.id);
            const busy = pendingProgramId === course.id && toggleProgram.isPending;
            return (
              <CenterCurriculumToggleCard
                key={course.id}
                title={course.name}
                subtitle={programCurriculumSubtitle(course.age_label, course.description)}
                checked={checked}
                disabled={busy}
                onChange={(enabled) => toggleProgram.mutate({ programId: course.id, enabled })}
              />
            );
          })
        )}
      </CentersSectionCard>

      {suspendMode ? (
        <CentersSectionCard title="Suspend franchise">
          <p className="ed-text-sm ed-muted">
            Suspending blocks center staff from /app and hides public registration. You can re-enable later.
          </p>
          <Input label="Reason (optional)" value={suspendReason} onChange={setSuspendReason} editable />
          <div className="ed-brand-centers__inline-actions">
            <Button onClick={() => suspend.mutate()} disabled={suspend.isPending}>
              {suspend.isPending ? "Suspending…" : "Confirm suspend"}
            </Button>
            <Button variant="ghost" onClick={() => setSuspendMode(false)}>
              Cancel
            </Button>
          </div>
        </CentersSectionCard>
      ) : null}

      {isMobile ? (
        <div className="ed-brand-centers__mobile-actions">
          <SaveButton
            onClick={() => saveProfile.mutate()}
            disabled={!form.name.trim() || saveProfile.isPending || !isDirty}
            pending={saveProfile.isPending}
            label="Save Changes"
            block
          />
          {center.status === "active" ? (
            <Button variant="danger" block onClick={() => setSuspendMode(true)}>
              Suspend franchise
            </Button>
          ) : (
            <Button block onClick={() => reEnable.mutate()} disabled={reEnable.isPending}>
              {reEnable.isPending ? "Re-enabling…" : "Re-enable franchise"}
            </Button>
          )}
        </div>
      ) : (
        <CenterDetailFooter
          suspendAction={
            center.status === "active" ? (
              <Button variant="danger" onClick={() => setSuspendMode(true)}>
                Suspend Franchise
              </Button>
            ) : (
              <Button onClick={() => reEnable.mutate()} disabled={reEnable.isPending}>
                {reEnable.isPending ? "Re-enabling…" : "Re-enable franchise"}
              </Button>
            )
          }
          resetAction={
            <Button variant="ghost" onClick={resetForm} disabled={!isDirty}>
              Reset Changes
            </Button>
          }
          saveAction={
            <SaveButton
              onClick={() => saveProfile.mutate()}
              disabled={!form.name.trim() || saveProfile.isPending || !isDirty}
              pending={saveProfile.isPending}
              label="Save Changes"
            />
          }
        />
      )}
    </div>
  );
}
