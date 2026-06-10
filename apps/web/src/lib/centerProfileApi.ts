import { getSupabase } from "@/lib/supabase";
import { supabaseMaybe } from "@/lib/supabaseResult";

export type CenterSocialLink = {
  platform: string;
  url: string;
};

export type CenterPublicProfileInput = {
  displayName: string;
  shortDescription: string;
  addressLine1: string;
  city: string;
  region: string;
  pincode: string;
  country: string;
  contactPhone: string;
  photoUrl: string;
  socialLinks: CenterSocialLink[];
};

export type CenterPublicProfileRow = CenterPublicProfileInput & {
  id: string;
  name: string;
  slug: string;
  status: string;
};

const PROFILE_SELECT =
  "id, name, slug, status, display_name, short_description, address_line1, city, region, pincode, country, contact_phone, photo_url, social_links";

function parseSocialLinks(raw: unknown): CenterSocialLink[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const row = entry as Record<string, unknown>;
      const platform = String(row.platform ?? "").trim();
      const url = String(row.url ?? "").trim();
      if (!platform || !url) return null;
      return { platform, url };
    })
    .filter((x): x is CenterSocialLink => x !== null)
    .slice(0, 6);
}

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
    socialLinks: parseSocialLinks(row.social_links),
  };
}

export function centerProfileToPayload(profile: CenterPublicProfileInput): Record<string, unknown> {
  return {
    display_name: profile.displayName.trim() || null,
    short_description: profile.shortDescription.trim() || null,
    address_line1: profile.addressLine1.trim() || null,
    city: profile.city.trim() || null,
    region: profile.region.trim() || null,
    pincode: profile.pincode.trim() || null,
    country: profile.country.trim() || "IN",
    contact_phone: profile.contactPhone.trim() || null,
    photo_url: profile.photoUrl.trim() || null,
    social_links: profile.socialLinks
      .filter((l) => l.platform.trim() && l.url.trim())
      .map((l) => ({ platform: l.platform.trim(), url: l.url.trim() })),
  };
}

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
