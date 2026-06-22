import { useMemo } from "react";
import {
  MutationError,
  PlatformSettingsActionButton,
  PlatformSettingsBadge,
  PlatformSettingsCard,
  PlatformSettingsCardHeader,
  PlatformSettingsDomainField,
  PlatformSettingsGhostButton,
  PlatformSettingsGrid,
  PlatformSettingsOutlineButton,
  PlatformSettingsPageHeader,
  PlatformSettingsPrimaryButton,
  PlatformSettingsProviderCard,
  PlatformSettingsShell,
  PlatformSettingsStatBox,
  PlatformSettingsStatGrid,
  PlatformSettingsStatus,
  PlatformSettingsToggleRow,
} from "@edunudg/ui";
import type { PlatformIntegrationKey } from "@/lib/platformIntegrations";
import {
  integrationsDirty,
  maskedPaymentKey,
  paymentGatewayConnected,
  paymentSuccessRateLabel,
  paymentVolumeLabel,
  PLATFORM_AUTH_SETTING_KEYS,
  PLATFORM_AUTH_SETTING_LABELS,
  PLATFORM_PUBLIC_SETTING_KEYS,
  PLATFORM_PUBLIC_SETTING_LABELS,
  platformSettingsDomain,
} from "@/lib/platformSettingsDisplay";
import "./settingsPage.css";

const ICON_SHIELD = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
  </svg>
);

const ICON_CARD = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
  </svg>
);

const ICON_GLOBE = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
  </svg>
);

const ICON_AUDIT = <span aria-hidden>↺</span>;
const ICON_EXPORT = <span aria-hidden>🗄</span>;

function SettingsCards({
  flags,
  onToggle,
  onExport,
}: {
  flags: Record<PlatformIntegrationKey, boolean>;
  onToggle: (key: PlatformIntegrationKey, checked: boolean) => void;
  onExport: () => void;
}) {
  const connected = paymentGatewayConnected(flags);
  const domain = platformSettingsDomain();

  return (
    <PlatformSettingsGrid>
      <PlatformSettingsCard span={2}>
        <PlatformSettingsCardHeader
          icon={ICON_SHIELD}
          title="Authentication"
          badge={<PlatformSettingsBadge tone="blue">Secure</PlatformSettingsBadge>}
        />
        {PLATFORM_AUTH_SETTING_KEYS.map((key) => {
          const meta = PLATFORM_AUTH_SETTING_LABELS[key];
          return (
            <PlatformSettingsToggleRow
              key={key}
              icon={meta.icon}
              title={meta.title}
              description={meta.description}
              checked={flags[key]}
              onChange={(checked) => onToggle(key, checked)}
            />
          );
        })}
      </PlatformSettingsCard>

      <PlatformSettingsCard>
        <PlatformSettingsCardHeader title="Maintenance" />
        <PlatformSettingsActionButton icon={ICON_AUDIT} label="Audit Logs" href="/admin/audit" />
        <PlatformSettingsActionButton icon={ICON_EXPORT} label="Export Data" onClick={onExport} />
      </PlatformSettingsCard>

      <PlatformSettingsCard>
        <PlatformSettingsCardHeader
          icon={ICON_CARD}
          title="Payments Gateway"
          status={
            connected ? (
              <PlatformSettingsStatus label="Connected" tone="success" />
            ) : (
              <PlatformSettingsStatus label="Disconnected" tone="neutral" />
            )
          }
        />
        <PlatformSettingsProviderCard
          logo="S"
          title="Stripe Global"
          meta={maskedPaymentKey()}
          action={
            <PlatformSettingsOutlineButton onClick={() => onToggle("payment_gateway", !flags.payment_gateway)}>
              Configure
            </PlatformSettingsOutlineButton>
          }
        />
        <PlatformSettingsStatGrid>
          <PlatformSettingsStatBox label="Volume (30D)" value={paymentVolumeLabel()} />
          <PlatformSettingsStatBox label="Success Rate" value={paymentSuccessRateLabel()} tone="success" />
        </PlatformSettingsStatGrid>
      </PlatformSettingsCard>

      <PlatformSettingsCard span={2}>
        <PlatformSettingsCardHeader
          icon={ICON_GLOBE}
          title="Public Website"
          action={
            <a className="ed-pfset-card__external" href="/" target="_blank" rel="noreferrer" aria-label="Open public website">
              ↗
            </a>
          }
        />
        {PLATFORM_PUBLIC_SETTING_KEYS.map((key) => {
          const meta = PLATFORM_PUBLIC_SETTING_LABELS[key];
          return (
            <PlatformSettingsToggleRow
              key={key}
              title={meta.title}
              description={meta.description}
              checked={flags[key]}
              onChange={(checked) => onToggle(key, checked)}
            />
          );
        })}
        <PlatformSettingsDomainField
          label="Custom Domain"
          value={domain}
          status={<PlatformSettingsStatus label="Verified" tone="success" />}
        />
      </PlatformSettingsCard>
    </PlatformSettingsGrid>
  );
}

export function SettingsPageView({
  flags,
  savedFlags,
  onFlagsChange,
  onSave,
  onCancel,
  savePending,
  saved,
  error,
  loading,
}: {
  flags: Record<PlatformIntegrationKey, boolean>;
  savedFlags: Record<PlatformIntegrationKey, boolean>;
  onFlagsChange: (next: Record<PlatformIntegrationKey, boolean>) => void;
  onSave: () => void;
  onCancel: () => void;
  savePending: boolean;
  saved: boolean;
  error: string | null;
  loading?: boolean;
}) {
  const dirty = useMemo(() => integrationsDirty(flags, savedFlags), [flags, savedFlags]);

  const toggle = (key: PlatformIntegrationKey, checked: boolean) => {
    onFlagsChange({ ...flags, [key]: checked });
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(flags, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "platform-settings-export.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PlatformSettingsShell>
      <MutationError message={error} />
      <PlatformSettingsPageHeader
        title="Platform Settings"
        subtitle="Configure global security, commerce, and brand visibility."
        actions={
          <>
            <PlatformSettingsGhostButton onClick={onCancel} disabled={!dirty || savePending}>
              Cancel
            </PlatformSettingsGhostButton>
            <PlatformSettingsPrimaryButton onClick={onSave} disabled={!dirty} pending={savePending}>
              {saved ? "Saved" : "Save Changes"}
            </PlatformSettingsPrimaryButton>
          </>
        }
      />

      {loading ? (
        <p className="ed-pfset-loading">Loading platform settings…</p>
      ) : (
        <SettingsCards flags={flags} onToggle={toggle} onExport={exportData} />
      )}
    </PlatformSettingsShell>
  );
}
