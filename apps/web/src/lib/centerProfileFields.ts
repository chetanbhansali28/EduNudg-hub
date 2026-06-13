export type CenterSocialLink = {
  platform: string;
  url: string;
};

export function parseSocialLinksFromRow(raw: unknown): CenterSocialLink[] {
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
