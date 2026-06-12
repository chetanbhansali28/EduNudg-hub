import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";

export type BrandCompetition = {
  id: string;
  name: string;
  event_date: string | null;
  location: string | null;
  is_active: boolean;
  fee_type: "free" | "paid";
  fee_amount: number | null;
  fee_currency: string | null;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  registration_mode: string;
  max_participants: number | null;
};

export async function listBrandCompetitions(brandId: string): Promise<BrandCompetition[]> {
  const { data, error } = await getSupabase()
    .from("brand_competitions")
    .select(
      "id, name, event_date, location, is_active, fee_type, fee_amount, fee_currency, registration_opens_at, registration_closes_at, registration_mode, max_participants"
    )
    .eq("brand_id", brandId)
    .order("event_date", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return supabaseList(data, null) as BrandCompetition[];
}

export async function upsertBrandCompetition(
  brandId: string,
  input: {
    id?: string;
    name: string;
    eventDate?: string;
    location?: string;
    isActive?: boolean;
    feeType?: "free" | "paid";
    feeAmount?: number | null;
    registrationOpensAt?: string;
    registrationClosesAt?: string;
    registrationMode?: string;
    maxParticipants?: number | null;
  }
): Promise<string> {
  const { data, error } = await getSupabase().rpc("upsert_brand_competition", {
    p_brand_id: brandId,
    p_id: input.id ?? null,
    p_name: input.name.trim(),
    p_event_date: input.eventDate || null,
    p_location: input.location?.trim() || null,
    p_is_active: input.isActive ?? true,
    p_fee_type: input.feeType ?? "free",
    p_fee_amount: input.feeAmount ?? null,
    p_fee_currency: "INR",
    p_registration_opens_at: input.registrationOpensAt || null,
    p_registration_closes_at: input.registrationClosesAt || null,
    p_registration_mode: input.registrationMode ?? "open",
    p_max_participants: input.maxParticipants ?? null,
    p_eligibility_rules: { requires_active_enrollment: true },
  });
  if (error) throw error;
  return data as string;
}
