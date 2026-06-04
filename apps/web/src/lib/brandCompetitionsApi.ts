import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";

export type BrandCompetition = {
  id: string;
  name: string;
  event_date: string | null;
  location: string | null;
  is_active: boolean;
};

export async function listBrandCompetitions(brandId: string): Promise<BrandCompetition[]> {
  const { data, error } = await getSupabase()
    .from("brand_competitions")
    .select("id, name, event_date, location, is_active")
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
  }
): Promise<string> {
  const { data, error } = await getSupabase().rpc("upsert_brand_competition", {
    p_brand_id: brandId,
    p_id: input.id ?? null,
    p_name: input.name.trim(),
    p_event_date: input.eventDate || null,
    p_location: input.location?.trim() || null,
    p_is_active: input.isActive ?? true,
  });
  if (error) throw error;
  return data as string;
}
