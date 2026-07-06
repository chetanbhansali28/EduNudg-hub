import type { HomepageConfig } from "@/types/homepage";

export type BrandSocialConnect = {
  facebookUrl?: string;
  instagramUrl?: string;
  whatsappPhoneE164?: string;
  whatsappPrefillMessage?: string;
  whatsappBubbleTitle?: string;
  whatsappBubbleBody?: string;
  whatsappEnabled?: boolean;
};

export const BRAND_SOCIAL_WHATSAPP_MESSAGE_MAX = 1000;

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

export function normalizeSocialUrl(value: string | undefined): string | undefined {
  const trimmed = trimOptional(value);
  if (!trimmed) return undefined;
  return isHttpsUrl(trimmed) ? trimmed : undefined;
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
    whatsappPhoneE164,
    whatsappPrefillMessage: trimOptional(row.whatsappPrefillMessage ?? row.whatsapp_prefill_message)?.slice(
      0,
      BRAND_SOCIAL_WHATSAPP_MESSAGE_MAX
    ),
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

function platformKind(platform: string, url: string): "facebook" | "instagram" | "whatsapp" | null {
  const p = platform.toLowerCase();
  const u = url.toLowerCase();
  if (p.includes("facebook") || u.includes("facebook.com")) return "facebook";
  if (p.includes("instagram") || u.includes("instagram.com")) return "instagram";
  if (p.includes("whatsapp") || u.includes("wa.me") || u.includes("whatsapp.com")) return "whatsapp";
  return null;
}

function phoneFromWhatsAppUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("wa.me")) return undefined;
    const digits = parsed.pathname.replace(/\D/g, "");
    return digits ? `+${digits}` : undefined;
  } catch {
    return undefined;
  }
}

/** Copies legacy `landing.footer.rich.socialLinks` when `social_connect` is empty. */
export function migrateSocialConnectFromLanding(
  socialConnect: BrandSocialConnect,
  landing?: Partial<HomepageConfig>
): BrandSocialConnect {
  const hasConfigured =
    Boolean(socialConnect.facebookUrl) ||
    Boolean(socialConnect.instagramUrl) ||
    Boolean(socialConnect.whatsappPhoneE164);
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
    if (kind === "whatsapp" && !migrated.whatsappPhoneE164) {
      migrated.whatsappPhoneE164 = phoneFromWhatsAppUrl(url) ?? normalizeWhatsAppPhone(url);
      if (migrated.whatsappPhoneE164) migrated.whatsappEnabled = true;
    }
  }
  return migrated;
}

export function hasBrandSocialFooterIcons(connect: BrandSocialConnect): boolean {
  return Boolean(connect.facebookUrl || connect.instagramUrl);
}

export function isBrandWhatsAppFloatVisible(connect: BrandSocialConnect): boolean {
  return connect.whatsappEnabled !== false && Boolean(normalizeWhatsAppPhone(connect.whatsappPhoneE164));
}

export function buildBrandWhatsAppHref(connect: BrandSocialConnect): string | null {
  const phone = normalizeWhatsAppPhone(connect.whatsappPhoneE164);
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const message = trimOptional(connect.whatsappPrefillMessage);
  const base = `https://wa.me/${digits}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}
