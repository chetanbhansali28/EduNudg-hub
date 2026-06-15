import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Input,
  MutationError,
  SettingsAccountLayout,
  SettingsMetaList,
  SettingsPageHeader,
  SettingsSection,
  SettingsStack,
} from "@edunudg/ui";
import { useAuth } from "@/bootstrap/AuthProvider";
import { useTenant } from "@/bootstrap/TenantProvider";
import { fetchCenterPublicProfile, updateCenterPublicProfile } from "@/lib/centerProfileApi";
import {
  formatCenterDisplayId,
  formatCenterStatusLabel,
  sendOwnerPasswordReset,
} from "@/lib/centerSettingsHelpers";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { CenterPhotoUpload } from "./CenterPhotoUpload";
import { CenterPublicProfileForm } from "./CenterPublicProfileForm";
import "./centerSettings.css";

export function CenterSettingsPage() {
  const tenant = useTenant();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [resetSent, setResetSent] = useState(false);

  const profile = useQuery({
    queryKey: ["center-public-profile", tenant.centerId],
    enabled: !!tenant.centerId,
    queryFn: () => fetchCenterPublicProfile(tenant.centerId!),
  });

  const resetPassword = useMutation({
    mutationFn: async () => {
      if (!user?.email) throw new Error("No sign-in email found for this account.");
      clear();
      await sendOwnerPasswordReset(user.email);
    },
    onSuccess: () => setResetSent(true),
    onError: capture,
  });

  const savePhoto = useMutation({
    mutationFn: async (photoUrl: string) => {
      const current = profile.data;
      if (!tenant.centerId || !current) return;
      clear();
      await updateCenterPublicProfile(tenant.centerId, {
        displayName: current.displayName,
        shortDescription: current.shortDescription,
        addressLine1: current.addressLine1,
        city: current.city,
        region: current.region,
        pincode: current.pincode,
        country: current.country,
        contactPhone: current.contactPhone,
        photoUrl,
        socialLinks: current.socialLinks,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["center-public-profile", tenant.centerId] });
      void qc.invalidateQueries({ queryKey: ["center-landing"] });
    },
    onError: capture,
  });

  const centerDisplayId = useMemo(() => {
    if (!tenant.brandSlug || !tenant.centerSlug || !tenant.centerId) return "—";
    return formatCenterDisplayId(tenant.brandSlug, tenant.centerSlug, tenant.centerId);
  }, [tenant.brandSlug, tenant.centerSlug, tenant.centerId]);

  const p = profile.data;

  return (
    <div className="ed-center-settings-page">
      <SettingsPageHeader title="Settings" />

      {profile.isLoading ? (
        <SettingsSection title="Account">
          <p className="ed-text-sm ed-muted">Loading…</p>
        </SettingsSection>
      ) : !p || !tenant.brandId || !tenant.centerId ? (
        <SettingsSection title="Account">
          <p className="ed-text-sm ed-muted">Center profile not found.</p>
        </SettingsSection>
      ) : (
        <SettingsStack>
          <SettingsSection title="Account" mobileLabel="Account info" className="ed-settings-section--account">
            <SettingsAccountLayout
              photo={
                <CenterPhotoUpload
                  brandId={tenant.brandId}
                  centerId={tenant.centerId}
                  currentPhotoUrl={p.photoUrl}
                  onUploaded={(url) => savePhoto.mutate(url)}
                  disabled={savePhoto.isPending}
                  variant="desktop"
                />
              }
            >
              <SettingsMetaList
                items={[
                  { label: "Center ID", value: centerDisplayId },
                  { label: "Account status", value: formatCenterStatusLabel(p.status) },
                  { label: "Owner email", value: user?.email ?? "—" },
                ]}
              />
              <FormFields
                centerDisplayId={centerDisplayId}
                ownerEmail={user?.email ?? ""}
                resetSent={resetSent}
                resetPending={resetPassword.isPending}
                onReset={() => resetPassword.mutate()}
              />
            </SettingsAccountLayout>
            <MutationError message={error} />
            {resetSent ? (
              <p className="ed-text-sm ed-muted" role="status">
                Password reset link sent to {user?.email}.
              </p>
            ) : null}
          </SettingsSection>

          <CenterPublicProfileForm brandId={tenant.brandId} centerId={tenant.centerId} profile={p} />
        </SettingsStack>
      )}
    </div>
  );
}

function FormFields({
  centerDisplayId,
  ownerEmail,
  resetSent,
  resetPending,
  onReset,
}: {
  centerDisplayId: string;
  ownerEmail: string;
  resetSent: boolean;
  resetPending: boolean;
  onReset: () => void;
}) {
  return (
    <div className="ed-settings-account-layout__fields">
      <Input label="Center ID" value={centerDisplayId} onChange={() => {}} disabled />
      <Input label="Owner email" value={ownerEmail} onChange={() => {}} disabled />
      <div className="ed-settings-password-row">
        <p className="ed-settings-password-row__label">Change password</p>
        <Button variant="secondary" onClick={onReset} disabled={!ownerEmail || resetPending || resetSent}>
          {resetSent ? "Reset link sent" : "Send reset link"}
        </Button>
      </div>
    </div>
  );
}
