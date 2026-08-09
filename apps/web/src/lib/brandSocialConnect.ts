import type { HomepageConfig } from "@/types/homepage";

export type BrandSocialConnect = {
  facebookUrl?: string;
  instagramUrl?: string;
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

function platformKind(platform: string, url: string): "facebook" | "instagram" | null {
  const p = platform.toLowerCase();
  const u = url.toLowerCase();
  if (p.includes("facebook") || u.includes("facebook.com")) return "facebook";
  if (p.includes("instagram") || u.includes("instagram.com")) return "instagram";
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
  return Boolean(connect.facebookUrl || connect.instagramUrl);
}
