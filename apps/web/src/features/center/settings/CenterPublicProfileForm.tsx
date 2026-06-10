import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Card, FormGrid, Input, MutationError, Select } from "@edunudg/ui";
import {
  type CenterPublicProfileInput,
  type CenterPublicProfileRow,
  updateCenterPublicProfile,
} from "@/lib/centerProfileApi";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { CenterPhotoUpload } from "./CenterPhotoUpload";
import "./centerSettings.css";

const SOCIAL_PLATFORMS = [
  "Facebook",
  "Instagram",
  "WhatsApp",
  "YouTube",
  "LinkedIn",
  "X (Twitter)",
];

const MAX_SOCIAL_LINKS = 6;

function profileToForm(row: CenterPublicProfileRow): CenterPublicProfileInput {
  return {
    displayName: row.displayName,
    shortDescription: row.shortDescription,
    addressLine1: row.addressLine1,
    city: row.city,
    region: row.region,
    pincode: row.pincode,
    country: row.country || "IN",
    contactPhone: row.contactPhone,
    photoUrl: row.photoUrl,
    socialLinks:
      row.socialLinks.length > 0
        ? row.socialLinks
        : [{ platform: "Facebook", url: "" }],
  };
}

type Props = {
  brandId: string;
  centerId: string;
  profile: CenterPublicProfileRow;
};

export function CenterPublicProfileForm({ brandId, centerId, profile }: Props) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [form, setForm] = useState(() => profileToForm(profile));

  useEffect(() => {
    setForm(profileToForm(profile));
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      clear();
      await updateCenterPublicProfile(centerId, form);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["center-public-profile", centerId] });
      void qc.invalidateQueries({ queryKey: ["center-landing"] });
    },
    onError: capture,
  });

  const setField = <K extends keyof CenterPublicProfileInput>(key: K, value: CenterPublicProfileInput[K]) => {
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

  return (
    <Card title="Public center profile">
      <p className="ed-text-sm ed-muted">
        These details appear on your public center site so parents can find and contact you. Your login email is shown
        under Account (from Google or social sign-in). Slug and status are managed by your brand.
      </p>
      <MutationError message={error} />

      <CenterPhotoUpload
        brandId={brandId}
        centerId={centerId}
        currentPhotoUrl={form.photoUrl}
        onUploaded={(url) => setField("photoUrl", url)}
        disabled={save.isPending}
      />

      <FormGrid>
        <Input
          label="Display name"
          value={form.displayName}
          onChange={(v) => setField("displayName", v)}
          placeholder={profile.name}
        />
        <Input
          label="Short description"
          value={form.shortDescription}
          onChange={(v) => setField("shortDescription", v)}
          placeholder="A sentence about your center for parents"
        />
      </FormGrid>

      <FormGrid>
        <Input
          label="Address line 1"
          value={form.addressLine1}
          onChange={(v) => setField("addressLine1", v)}
        />
        <Input label="City" value={form.city} onChange={(v) => setField("city", v)} />
        <Input label="State / region" value={form.region} onChange={(v) => setField("region", v)} />
        <Input label="Pincode" value={form.pincode} onChange={(v) => setField("pincode", v)} />
        <Input label="Country" value={form.country} onChange={(v) => setField("country", v)} />
      </FormGrid>

      <FormGrid>
        <Input
          label="Phone / WhatsApp"
          value={form.contactPhone}
          onChange={(v) => setField("contactPhone", v)}
          placeholder="+91…"
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
            />
            <Input
              label="Profile URL"
              value={link.url}
              onChange={(url) => updateSocial(index, { url })}
              placeholder="https://…"
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

      <Button onClick={() => save.mutate()} disabled={save.isPending}>
        {save.isPending ? "Saving…" : "Save profile"}
      </Button>
    </Card>
  );
}
