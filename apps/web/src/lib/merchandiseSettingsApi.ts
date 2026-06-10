import { getSupabase } from "@/lib/supabase";

export type MerchandiseBrandSettings = {
  payment_mode: "razorpay" | "invoice" | "both";
  require_payment_before_fulfillment: boolean;
  invoice_due_days: number;
  razorpay_key_id: string;
  invoice_details: {
    bank_name?: string;
    account_number?: string;
    upi_id?: string;
  };
  reminders: {
    enabled: boolean;
    days_before_due: number[];
    days_after_due: number[];
    pending_payment_hours: number;
    email_from_name: string;
  };
};

export const DEFAULT_MERCHANDISE_SETTINGS: MerchandiseBrandSettings = {
  payment_mode: "both",
  require_payment_before_fulfillment: true,
  invoice_due_days: 7,
  razorpay_key_id: "",
  invoice_details: {},
  reminders: {
    enabled: true,
    days_before_due: [3],
    days_after_due: [1, 7],
    pending_payment_hours: 24,
    email_from_name: "",
  },
};

export function parseMerchandiseSettings(settings: Record<string, unknown>): MerchandiseBrandSettings {
  const raw = (settings.merchandise ?? {}) as Partial<MerchandiseBrandSettings>;
  return {
    ...DEFAULT_MERCHANDISE_SETTINGS,
    ...raw,
    invoice_details: { ...DEFAULT_MERCHANDISE_SETTINGS.invoice_details, ...raw.invoice_details },
    reminders: { ...DEFAULT_MERCHANDISE_SETTINGS.reminders, ...raw.reminders },
  };
}

export async function fetchMerchandiseBrandSettings(brandId: string): Promise<MerchandiseBrandSettings> {
  const { data, error } = await getSupabase()
    .from("brand_settings")
    .select("settings")
    .eq("brand_id", brandId)
    .maybeSingle();
  if (error) throw error;
  return parseMerchandiseSettings((data?.settings ?? {}) as Record<string, unknown>);
}

export async function saveMerchandiseBrandSettings(
  brandId: string,
  settingsId: string | null,
  currentSettings: Record<string, unknown>,
  merchandise: MerchandiseBrandSettings
): Promise<void> {
  const merged = { ...currentSettings, merchandise };
  if (settingsId) {
    const { error } = await getSupabase()
      .from("brand_settings")
      .update({ settings: merged })
      .eq("id", settingsId);
    if (error) throw error;
  } else {
    const { error } = await getSupabase().from("brand_settings").insert({ brand_id: brandId, settings: merged });
    if (error) throw error;
  }
}
