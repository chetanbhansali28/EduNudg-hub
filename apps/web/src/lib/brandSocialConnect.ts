import type { HomepageConfig } from "@/types/homepage";

export type BrandSocialConnect = {
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  whatsappUrl?: string;
  linkedinUrl?: string;
  xUrl?: string;
  /** @deprecated Kept for stored settings round-trip; not shown on public landing. */
  whatsappPhoneE164?: string;
  /** @deprecated Kept for stored settings round-trip; not shown on public landing. */
  whatsappPrefillMessage?: string;
  /** @deprecated Kept for stored settings round-trip; not shown on public landing. */
  whatsappBubbleTitle?: string;
  /** @deprecated Kept for stored settings round-trip; not shown on public landing. */
  whatsappBubbleBody?: string;
  /** @deprecated Kept for stored settings round-trip; not shown on public landing. */
  whatsappEnabled?: boolean;
};

const EMPTY: BrandSocialConnect = {};

function trimOptional(value: unknown): string | undefined {
  const text = String(value ?? "").trim();
  return text || undefined;
}

function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function extractHttpsUrl(value: string | undefined): string | undefined {
  const trimmed = trimOptional(value);
  if (!trimmed) return undefined;
  if (isHttpsUrl(trimmed)) return trimmed;
  const match = trimmed.match(/https:\/\/[^\s<>"]+/i);
  if (!match?.[0]) return undefined;
  const cleaned = match[0].replace(/[.,;:)]+$/, "");
  return isHttpsUrl(cleaned) ? cleaned : undefined;
}

export function normalizeSocialUrl(value: string | undefined): string | undefined {
  return extractHttpsUrl(value);
}

export function normalizeWhatsAppPhone(value: string | undefined): string | undefined {
  const trimmed = trimOptional(value);
  if (!trimmed) return undefined;
  const digits = trimmed.replace(/\D/g, "");
  return digits.length >= 10 ? trimmed : undefined;
}

export function parseBrandSocialConnectRecord(raw: unknown): BrandSocialConnect {
  if (!raw || typeof raw !== "object") return { ...EMPTY };
  const row = raw as Record<string, unknown>;
  const whatsappPhoneE164 = normalizeWhatsAppPhone(
    trimOptional(row.whatsappPhoneE164 ?? row.whatsapp_phone_e164)
  );
  return {
    facebookUrl: normalizeSocialUrl(trimOptional(row.facebookUrl ?? row.facebook_url)),
    instagramUrl: normalizeSocialUrl(trimOptional(row.instagramUrl ?? row.instagram_url)),
    youtubeUrl: normalizeSocialUrl(trimOptional(row.youtubeUrl ?? row.youtube_url)),
    whatsappUrl: normalizeSocialUrl(trimOptional(row.whatsappUrl ?? row.whatsapp_url)),
    linkedinUrl: normalizeSocialUrl(trimOptional(row.linkedinUrl ?? row.linkedin_url)),
    xUrl: normalizeSocialUrl(trimOptional(row.xUrl ?? row.x_url ?? row.twitterUrl ?? row.twitter_url)),
    whatsappPhoneE164,
    whatsappPrefillMessage: trimOptional(row.whatsappPrefillMessage ?? row.whatsapp_prefill_message),
    whatsappBubbleTitle: trimOptional(row.whatsappBubbleTitle ?? row.whatsapp_bubble_title),
    whatsappBubbleBody: trimOptional(row.whatsappBubbleBody ?? row.whatsapp_bubble_body),
    whatsappEnabled:
      row.whatsappEnabled === false || row.whatsapp_enabled === false
        ? false
        : Boolean(whatsappPhoneE164),
  };
}

export function parseBrandSocialConnect(
  settings: Record<string, unknown> | undefined,
  landing?: Partial<HomepageConfig>
): BrandSocialConnect {
  const fromSettings = parseBrandSocialConnectRecord(settings?.social_connect);
  return migrateSocialConnectFromLanding(fromSettings, landing);
}

function platformKind(
  platform: string,
  url: string,
): "facebook" | "instagram" | "youtube" | "whatsapp" | "linkedin" | "x" | null {
  const p = platform.toLowerCase();
  const u = url.toLowerCase();
  if (p.includes("facebook") || u.includes("facebook.com")) return "facebook";
  if (p.includes("instagram") || u.includes("instagram.com")) return "instagram";
  if (p.includes("youtube") || u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (p.includes("whatsapp") || u.includes("whatsapp.com") || u.includes("wa.me")) return "whatsapp";
  if (p.includes("linkedin") || u.includes("linkedin.com")) return "linkedin";
  if (p.includes("twitter") || p === "x" || p.includes("x (twitter)") || u.includes("twitter.com") || u.includes("x.com")) {
    return "x";
  }
  return null;
}

/** Copies legacy `landing.footer.rich.socialLinks` when `social_connect` is empty. */
export function migrateSocialConnectFromLanding(
  socialConnect: BrandSocialConnect,
  landing?: Partial<HomepageConfig>
): BrandSocialConnect {
  const hasConfigured = Boolean(socialConnect.facebookUrl) || Boolean(socialConnect.instagramUrl);
  if (hasConfigured) return socialConnect;

  const links = landing?.footer?.rich?.socialLinks ?? [];
  if (links.length === 0) return socialConnect;

  const migrated: BrandSocialConnect = { ...socialConnect };
  for (const link of links) {
    const url = trimOptional(link.url);
    if (!url) continue;
    const kind = platformKind(link.platform, url);
    if (kind === "facebook" && !migrated.facebookUrl && isHttpsUrl(url)) {
      migrated.facebookUrl = url;
    }
    if (kind === "instagram" && !migrated.instagramUrl && isHttpsUrl(url)) {
      migrated.instagramUrl = url;
    }
  }
  return migrated;
}

export function hasBrandSocialFooterIcons(connect: BrandSocialConnect): boolean {
  return Boolean(
    connect.facebookUrl ||
      connect.instagramUrl ||
      connect.youtubeUrl ||
      connect.whatsappUrl ||
      connect.linkedinUrl ||
      connect.xUrl,
  );
}

/** Footer social icons from franchise `social_links` (legacy mapper; public center footers use brand `social_connect`). */
export function socialConnectFromCenterLinks(
  links: Array<{ platform: string; url: string }>
): BrandSocialConnect {
  const migrated: BrandSocialConnect = {};
  for (const link of links) {
    const url = normalizeSocialUrl(trimOptional(link.url));
    if (!url) continue;
    const kind = platformKind(link.platform, url);
    if (kind === "facebook" && !migrated.facebookUrl) migrated.facebookUrl = url;
    if (kind === "instagram" && !migrated.instagramUrl) migrated.instagramUrl = url;
    if (kind === "youtube" && !migrated.youtubeUrl) migrated.youtubeUrl = url;
    if (kind === "whatsapp" && !migrated.whatsappUrl) migrated.whatsappUrl = url;
    if (kind === "linkedin" && !migrated.linkedinUrl) migrated.linkedinUrl = url;
    if (kind === "x" && !migrated.xUrl) migrated.xUrl = url;
  }
  return migrated;
}
