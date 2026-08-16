import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormGrid, Input, MutationError, PipelineWorkspace, SaveButton, Select, ToggleField } from "@edunudg/ui";
import { useOpsBreakpoint } from "@/features/center/hooks/useOpsBreakpoint";
import {
  DEFAULT_MERCHANDISE_SETTINGS,
  fetchMerchandiseBrandSettings,
  saveMerchandiseBrandSettings,
  type MerchandiseBrandSettings,
} from "@/lib/merchandiseSettingsApi";
import { getSupabase } from "@/lib/supabase";
import { supabaseMaybe } from "@/lib/supabaseResult";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { MerchandisePipelineListItem } from "./MerchandisePipelineListItem";
import {
  filterMerchandisePaymentGroups,
  merchandisePaymentSettingGroups,
  type PaymentSettingGroup,
  type PaymentSettingGroupId,
} from "./merchandisePageHelpers";
import "./brandMerchandiseCatalog.css";

type Props = {
  brandId: string;
  search?: string;
};

export function BrandMerchandisePaymentSettings({ brandId, search = "" }: Props) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const { isDesktop } = useOpsBreakpoint();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<MerchandiseBrandSettings>(DEFAULT_MERCHANDISE_SETTINGS);
  const [selectedId, setSelectedId] = useState<PaymentSettingGroupId | null>("mode");

  const settingsRow = useQuery({
    queryKey: ["brand-settings", brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("brand_settings")
        .select("id, settings")
        .eq("brand_id", brandId)
        .maybeSingle();
      return supabaseMaybe(data, qErr) as { id: string; settings: Record<string, unknown> } | null;
    },
  });

  const merchandiseSettings = useQuery({
    queryKey: ["merchandise-brand-settings", brandId],
    enabled: !!brandId,
    queryFn: () => fetchMerchandiseBrandSettings(brandId),
  });

  useEffect(() => {
    if (merchandiseSettings.data) {
      setForm(merchandiseSettings.data);
    }
  }, [merchandiseSettings.data]);

  const allGroups = useMemo(() => merchandisePaymentSettingGroups(form), [form]);
  const filteredGroups = useMemo(
    () => filterMerchandisePaymentGroups(allGroups, search),
    [allGroups, search],
  );

  useEffect(() => {
    if (selectedId && filteredGroups.some((group) => group.id === selectedId)) return;
    setSelectedId(filteredGroups[0]?.id ?? null);
  }, [filteredGroups, selectedId]);

  const save = useMutation({
    mutationFn: async () => {
      clear();
      await saveMerchandiseBrandSettings(
        brandId,
        settingsRow.data?.id ?? null,
        settingsRow.data?.settings ?? {},
        form,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["brand-settings", brandId] });
      void qc.invalidateQueries({ queryKey: ["merchandise-brand-settings", brandId] });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    },
    onError: capture,
  });

  const patch = <K extends keyof MerchandiseBrandSettings>(key: K, value: MerchandiseBrandSettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const selectedGroup = filteredGroups.find((group) => group.id === selectedId) ?? null;

  const renderGroupForm = (group: PaymentSettingGroup) => {
    if (group.id === "mode") {
      return (
        <>
          <FormGrid>
            <Select
              label="Payment mode"
              value={form.payment_mode}
              onChange={(value) => patch("payment_mode", value as MerchandiseBrandSettings["payment_mode"])}
              options={[
                { value: "both", label: "Razorpay and invoice" },
                { value: "razorpay", label: "Razorpay only" },
                { value: "invoice", label: "Invoice only" },
              ]}
            />
          </FormGrid>
          <ToggleField
            label="Require payment before fulfillment"
            description="Centers must pay before orders can be approved or shipped"
            checked={form.require_payment_before_fulfillment}
            onChange={(checked) => patch("require_payment_before_fulfillment", checked)}
          />
        </>
      );
    }

    if (group.id === "razorpay") {
      return (
        <FormGrid>
          <Input
            label="Razorpay key ID"
            value={form.razorpay_key_id}
            onChange={(value) => patch("razorpay_key_id", value)}
            placeholder="rzp_live_..."
          />
        </FormGrid>
      );
    }

    if (group.id === "invoice") {
      return (
        <FormGrid>
          <Input
            label="Invoice due days"
            value={String(form.invoice_due_days)}
            onChange={(value) => patch("invoice_due_days", parseInt(value, 10) || 7)}
            type="number"
          />
          <Input
            label="Bank name"
            value={form.invoice_details.bank_name ?? ""}
            onChange={(value) =>
              patch("invoice_details", { ...form.invoice_details, bank_name: value.trim() || undefined })
            }
          />
          <Input
            label="Account number"
            value={form.invoice_details.account_number ?? ""}
            onChange={(value) =>
              patch("invoice_details", { ...form.invoice_details, account_number: value.trim() || undefined })
            }
          />
          <Input
            label="UPI ID"
            value={form.invoice_details.upi_id ?? ""}
            onChange={(value) =>
              patch("invoice_details", { ...form.invoice_details, upi_id: value.trim() || undefined })
            }
          />
        </FormGrid>
      );
    }

    return (
      <ToggleField
        label="Reminders enabled"
        description="Send invoice and pending-payment reminders to centers"
        checked={form.reminders.enabled}
        onChange={(checked) => patch("reminders", { ...form.reminders, enabled: checked })}
      />
    );
  };

  const renderCard = (group: PaymentSettingGroup) => (
    <article key={group.id} className="ed-brand-merch-card ed-brand-merch-card--simple">
      <div className="ed-brand-merch-card__inner">
        <div className="ed-brand-merch-card__details">
          <div className="ed-brand-merch-card__head">
            <div className="ed-brand-merch-card__title-row">
              <h3 className="ed-brand-merch-card__title">{group.title}</h3>
              <span className={`ed-brand-merch-card__badge ed-brand-merch-card__badge--${group.badgeTone === "approved" ? "active" : "draft"}`}>
                {group.badge}
              </span>
            </div>
            <SaveButton onClick={() => save.mutate()} pending={save.isPending} saved={saved} />
          </div>
          <p className="ed-brand-merch-card__description">{group.detail}</p>
          {renderGroupForm(group)}
        </div>
      </div>
    </article>
  );

  const emptyCopy =
    filteredGroups.length === 0 ? "No payment settings match this view." : null;
  const listEmpty = emptyCopy ? <p className="ed-brand-merch-catalog__empty">{emptyCopy}</p> : null;

  const listPanel =
    filteredGroups.length === 0 ? (
      listEmpty
    ) : (
      <div className="ed-franchise-apps-page__desktop-list">
        {filteredGroups.map((group) => (
          <MerchandisePipelineListItem
            key={group.id}
            selected={group.id === selectedId}
            badge={group.badge}
            badgeTone={group.badgeTone}
            when=""
            title={group.title}
            location={group.detail}
            onClick={() => setSelectedId(group.id)}
          />
        ))}
      </div>
    );

  const detailPanel = selectedGroup ? (
    <div className="ed-brand-merch-catalog">{renderCard(selectedGroup)}</div>
  ) : (
    <div className="ed-franchise-apps-page__placeholder">
      <p className="ed-text-sm ed-muted">Select a payment setting to review how centers pay for merchandise.</p>
    </div>
  );

  return (
    <>
      <MutationError message={error} />

      {isDesktop ? (
        <PipelineWorkspace detailOpen={!!selectedGroup} list={listPanel} detail={detailPanel} />
      ) : (
        <div className="ed-brand-merch-catalog">
          {listEmpty}
          {filteredGroups.map((group) => renderCard(group))}
        </div>
      )}
    </>
  );
}
