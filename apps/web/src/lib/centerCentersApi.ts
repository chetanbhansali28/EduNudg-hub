import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import {
  centerProfileToPayload,
  parseSocialLinksFromRow,
  type CenterPublicProfileInput,
  type CenterSocialLink,
} from "@/lib/centerProfileFields";

export type CenterStatus = "pending" | "active" | "suspended" | "closed";

export type BrandCenterRow = {
  id: string;
  slug: string;
  name: string;
  display_name: string | null;
  status: CenterStatus;
  city: string | null;
  region: string | null;
  pincode: string | null;
  contact_phone: string | null;
  address_line1: string | null;
  short_description: string | null;
  country: string | null;
  photo_url: string | null;
  social_links: CenterSocialLink[];
};

export type FranchiseCenterUpdateInput = CenterPublicProfileInput & {
  name: string;
};

const CENTER_SELECT =
  "id, slug, name, display_name, status, city, region, pincode, contact_phone, address_line1, short_description, country, photo_url, social_links";

function rowToCenter(row: Record<string, unknown>): BrandCenterRow {
  return {
    id: String(row.id),
    slug: String(row.slug ?? ""),
    name: String(row.name ?? ""),
    display_name: row.display_name != null ? String(row.display_name) : null,
    status: String(row.status ?? "pending") as CenterStatus,
    city: row.city != null ? String(row.city) : null,
    region: row.region != null ? String(row.region) : null,
    pincode: row.pincode != null ? String(row.pincode) : null,
    contact_phone: row.contact_phone != null ? String(row.contact_phone) : null,
    address_line1: row.address_line1 != null ? String(row.address_line1) : null,
    short_description: row.short_description != null ? String(row.short_description) : null,
    country: row.country != null ? String(row.country) : null,
    photo_url: row.photo_url != null ? String(row.photo_url) : null,
    social_links: parseSocialLinksFromRow(row.social_links),
  };
}

export function normalizePhoneDigits(phone: string | null | undefined): string {
  return (phone ?? "").replace(/\D/g, "");
}

export function centerMatchesSearch(center: BrandCenterRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const phoneQ = normalizePhoneDigits(q);
  const haystack = [
    center.name,
    center.display_name ?? "",
    center.contact_phone ?? "",
    normalizePhoneDigits(center.contact_phone),
  ]
    .join(" ")
    .toLowerCase();
  if (haystack.includes(q)) return true;
  if (phoneQ.length >= 3 && normalizePhoneDigits(center.contact_phone).includes(phoneQ)) return true;
  return false;
}

export async function fetchBrandCenters(brandId: string): Promise<BrandCenterRow[]> {
  const { data, error } = await getSupabase()
    .from("franchise_centers")
    .select(CENTER_SELECT)
    .eq("brand_id", brandId)
    .is("deleted_at", null)
    .order("name");
  return supabaseList(data, error).map((row) => rowToCenter(row as Record<string, unknown>));
}

export async function updateFranchiseCenter(centerId: string, input: FranchiseCenterUpdateInput): Promise<void> {
  const sb = getSupabase();
  const { error: profileErr } = await sb.rpc("update_center_public_profile_rpc", {
    p_center_id: centerId,
    p_payload: centerProfileToPayload(input),
  });
  if (profileErr) throw profileErr;

  const { error: nameErr } = await sb
    .from("franchise_centers")
    .update({ name: input.name.trim() })
    .eq("id", centerId);
  if (nameErr) throw nameErr;
}

export async function setFranchiseCenterStatus(
  centerId: string,
  status: "active" | "suspended",
  reason?: string
): Promise<void> {
  const { error } = await getSupabase().rpc("set_franchise_center_status", {
    p_center_id: centerId,
    p_status: status,
    p_reason: reason?.trim() || null,
  });
  if (error) throw error;
}

export type CenterStats = {
  openLeads: number;
  staleLeads: number;
  students: number;
  activeEnrollments: number;
};

export async function fetchCenterStats(centerId: string): Promise<CenterStats> {
  const sb = getSupabase();
  const [openLeads, enrollments] = await Promise.all([
    sb
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("center_id", centerId)
      .in("status", ["new", "contacted", "qualified"]),
    sb
      .from("student_enrollments")
      .select("id, student_id", { count: "exact" })
      .eq("center_id", centerId)
      .eq("status", "active"),
  ]);

  const enrollmentRows = enrollments.data ?? [];
  const uniqueStudents = new Set(enrollmentRows.map((r) => r.student_id as string)).size;

  return {
    openLeads: openLeads.count ?? 0,
    staleLeads: 0,
    students: uniqueStudents,
    activeEnrollments: enrollments.count ?? enrollmentRows.length,
  };
}
