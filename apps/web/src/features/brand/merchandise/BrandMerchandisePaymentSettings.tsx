import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  FormGrid,
  Input,
  MutationError,
  PageGridFull,
  SaveButton,
  Select,
  ToggleField,
} from "@edunudg/ui";
import {
  DEFAULT_MERCHANDISE_SETTINGS,
  fetchMerchandiseBrandSettings,
  saveMerchandiseBrandSettings,
  type MerchandiseBrandSettings,
} from "@/lib/merchandiseSettingsApi";
import { getSupabase } from "@/lib/supabase";
import { supabaseMaybe } from "@/lib/supabaseResult";
import { useMutationError } from "@/features/platform/hooks/useMutationError";

type Props = { brandId: string };

export function BrandMerchandisePaymentSettings({ brandId }: Props) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<MerchandiseBrandSettings>(DEFAULT_MERCHANDISE_SETTINGS);

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

  const save = useMutation({
    mutationFn: async () => {
      clear();
      await saveMerchandiseBrandSettings(
        brandId,
        settingsRow.data?.id ?? null,
        settingsRow.data?.settings ?? {},
        form
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

  return (
    <>
      <MutationError message={error} />

      <PageGridFull>
        <Card
          title="Payment settings"
          actions={<SaveButton onClick={() => save.mutate()} pending={save.isPending} saved={saved} />}
        >
          <p className="ed-text-sm ed-muted">
            Configure how franchise centers pay for merchandise orders and invoice reminders.
          </p>

          <FormGrid>
            <Select
              label="Payment mode"
              value={form.payment_mode}
              onChange={(v) => patch("payment_mode", v)}
              options={[
                { value: "both", label: "Razorpay and invoice" },
                { value: "razorpay", label: "Razorpay only" },
                { value: "invoice", label: "Invoice only" },
              ]}
            />
            <Input
              label="Invoice due days"
              value={String(form.invoice_due_days)}
              onChange={(v) => patch("invoice_due_days", parseInt(v, 10) || 7)}
              type="number"
            />
            <Input
              label="Razorpay key ID"
              value={form.razorpay_key_id}
              onChange={(v) => patch("razorpay_key_id", v)}
              placeholder="rzp_live_..."
            />
          </FormGrid>

          <ToggleField
            label="Require payment before fulfillment"
            description="Centers must pay before orders can be approved or shipped"
            checked={form.require_payment_before_fulfillment}
            onChange={(checked) => patch("require_payment_before_fulfillment", checked)}
          />

          <h3 className="ed-text-sm" style={{ marginTop: "1rem", marginBottom: "0.5rem" }}>
            Invoice bank / UPI details
          </h3>
          <FormGrid>
            <Input
              label="Bank name"
              value={form.invoice_details.bank_name ?? ""}
              onChange={(v) =>
                patch("invoice_details", { ...form.invoice_details, bank_name: v.trim() || undefined })
              }
            />
            <Input
              label="Account number"
              value={form.invoice_details.account_number ?? ""}
              onChange={(v) =>
                patch("invoice_details", { ...form.invoice_details, account_number: v.trim() || undefined })
              }
            />
            <Input
              label="UPI ID"
              value={form.invoice_details.upi_id ?? ""}
              onChange={(v) =>
                patch("invoice_details", { ...form.invoice_details, upi_id: v.trim() || undefined })
              }
            />
          </FormGrid>

          <h3 className="ed-text-sm" style={{ marginTop: "1rem", marginBottom: "0.5rem" }}>
            Payment reminders
          </h3>
          <ToggleField
            label="Reminders enabled"
            description="Send invoice and pending-payment reminders to centers"
            checked={form.reminders.enabled}
            onChange={(checked) => patch("reminders", { ...form.reminders, enabled: checked })}
          />
        </Card>
      </PageGridFull>
    </>
  );
}
