import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";

export type BrandCampaign = {
  id: string;
  name: string;
  description: string | null;
  goal_type: string;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
};

export type ActiveBrandCampaign = {
  id: string;
  name: string;
  description: string | null;
  goal_type: string;
  starts_at: string | null;
  ends_at: string | null;
};

export async function listBrandCampaigns(brandId: string): Promise<BrandCampaign[]> {
  const { data, error } = await getSupabase()
    .from("brand_campaigns")
    .select("id, name, description, goal_type, starts_at, ends_at, is_active")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return supabaseList(data, null) as BrandCampaign[];
}

export async function upsertBrandCampaign(
  brandId: string,
  input: {
    id?: string;
    name: string;
    description?: string;
    goalType?: string;
    startsAt?: string;
    endsAt?: string;
    isActive?: boolean;
  }
): Promise<string> {
  const { data, error } = await getSupabase().rpc("upsert_brand_campaign", {
    p_brand_id: brandId,
    p_id: input.id ?? null,
    p_name: input.name.trim(),
    p_description: input.description?.trim() || null,
    p_goal_type: input.goalType?.trim() || "enrollment",
    p_starts_at: input.startsAt ? new Date(input.startsAt).toISOString() : null,
    p_ends_at: input.endsAt ? new Date(input.endsAt).toISOString() : null,
    p_is_active: input.isActive ?? false,
  });
  if (error) throw error;
  return data as string;
}

export async function deleteBrandCampaign(brandId: string, campaignId: string): Promise<void> {
  const { error } = await getSupabase().rpc("delete_brand_campaign", {
    p_brand_id: brandId,
    p_id: campaignId,
  });
  if (error) throw error;
}

export async function listActiveBrandCampaigns(brandId: string): Promise<ActiveBrandCampaign[]> {
  const { data, error } = await getSupabase().rpc("list_active_brand_campaigns", {
    p_brand_id: brandId,
  });
  if (error) throw error;
  return (data ?? []) as ActiveBrandCampaign[];
}
