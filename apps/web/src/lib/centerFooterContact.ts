import type { CenterPublicProfile } from "@/lib/centerLandingApi";

export type CenterFooterContact = {
  addressLines: string[];
  phone: string | null;
};

type ProfileContact = Pick<
  CenterPublicProfile,
  "addressLine1" | "city" | "region" | "pincode" | "contactPhone"
>;

export function formatCenterLocationLine(profile: ProfileContact): string {
  return [profile.city, profile.region, profile.pincode].filter(Boolean).join(" · ");
}

export function centerPhoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** Overlay for center-host footers — Franchise Management address/phone, not brand head office. */
export function centerFooterContactFromProfile(
  profile: ProfileContact | null | undefined
): CenterFooterContact | null {
  if (!profile) return null;
  const street = profile.addressLine1?.trim() ?? "";
  const location = formatCenterLocationLine(profile);
  const phone = profile.contactPhone?.trim() ?? "";
  if (!street && !location && !phone) return null;
  return {
    addressLines: [street, location].filter(Boolean),
    phone: phone || null,
  };
}
