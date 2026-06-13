import { getSupabase } from "@/lib/supabase";
import { supabaseMaybe } from "@/lib/supabaseResult";
import {
  centerProfileToPayload,
  parseSocialLinksFromRow,
  type CenterPublicProfileInput,
  type CenterSocialLink,
} from "@/lib/centerProfileFields";

export type { CenterPublicProfileInput, CenterSocialLink };

export type CenterPublicProfileRow = CenterPublicProfileInput & {
  id: string;
  name: string;
  slug: string;
  status: string;
};

const PROFILE_SELECT =
  "id, name, slug, status, display_name, short_description, address_line1, city, region, pincode, country, contact_phone, photo_url, social_links";

function rowToProfile(row: Record<string, unknown>): CenterPublicProfileRow {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    slug: String(row.slug ?? ""),
    status: String(row.status ?? ""),
    displayName: String(row.display_name ?? ""),
    shortDescription: String(row.short_description ?? ""),
    addressLine1: String(row.address_line1 ?? ""),
    city: String(row.city ?? ""),
    region: String(row.region ?? ""),
    pincode: String(row.pincode ?? ""),
    country: String(row.country ?? "IN"),
    contactPhone: String(row.contact_phone ?? ""),
    photoUrl: String(row.photo_url ?? ""),
    socialLinks: parseSocialLinksFromRow(row.social_links),
  };
}

export { centerProfileToPayload };

export async function fetchCenterPublicProfile(centerId: string): Promise<CenterPublicProfileRow | null> {
  const { data, error } = await getSupabase()
    .from("franchise_centers")
    .select(PROFILE_SELECT)
    .eq("id", centerId)
    .maybeSingle();
  const row = supabaseMaybe(data, error);
  if (!row) return null;
  return rowToProfile(row as Record<string, unknown>);
}

export async function updateCenterPublicProfile(
  centerId: string,
  profile: CenterPublicProfileInput
): Promise<void> {
  const { error } = await getSupabase().rpc("update_center_public_profile_rpc", {
    p_center_id: centerId,
    p_payload: centerProfileToPayload(profile),
  });
  if (error) throw error;
}
