import { getSupabase } from "@/lib/supabase";

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
] as const;

export function formatCenterDisplayId(
  brandSlug: string,
  centerSlug: string,
  centerId: string
): string {
  const brandCode = brandSlug.replace(/[^a-z0-9]/gi, "").slice(0, 2).toUpperCase() || "FC";
  const centerCode = centerSlug.replace(/[^a-z0-9]/gi, "").slice(0, 3).toUpperCase() || "CTR";
  const suffix = centerId.replace(/-/g, "").slice(-3).toUpperCase();
  return `${brandCode}-${centerCode}-${suffix}`;
}

export function formatCenterStatusLabel(status: string): string {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
}

export function splitIndiaPhone(contactPhone: string): string {
  const digits = contactPhone.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length > 10) return digits.slice(2);
  return digits;
}

export function joinIndiaPhone(nationalDigits: string): string {
  const digits = nationalDigits.replace(/\D/g, "");
  if (!digits) return "";
  return `+91${digits}`;
}

export function googleMapsSearchUrl(parts: {
  addressLine1?: string;
  city?: string;
  region?: string;
  pincode?: string;
}): string | null {
  const query = [parts.addressLine1, parts.city, parts.region, parts.pincode, "India"]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function formatSettingsLastEdited(updatedAt?: string | null, now = Date.now()): string | null {
  if (!updatedAt) return null;
  const edited = new Date(updatedAt);
  if (Number.isNaN(edited.getTime())) return null;

  const sameDay = new Date(now).toDateString() === edited.toDateString();
  const time = new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(edited);

  if (sameDay) return `Last edited today at ${time}`;
  return `Last edited ${new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(edited)} at ${time}`;
}

export async function sendOwnerPasswordReset(email: string): Promise<void> {
  const redirectTo = `${window.location.origin}/login`;
  const { error } = await getSupabase().auth.resetPasswordForEmail(email.trim(), { redirectTo });
  if (error) throw error;
}

export function normalizeSocialPlatformKey(platform: string): string {
  return platform.toLowerCase().replace(/[^a-z]/g, "");
}
