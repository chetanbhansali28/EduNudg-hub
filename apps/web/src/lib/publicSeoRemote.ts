import { createClient } from "@supabase/supabase-js";
import { parsePublicCurriculum, type PublicCurriculumProgram } from "./brandCurriculumPublic";
import { parseBrandLegalPagesRecord, type BrandLegalPages } from "./brandLegalPages";
import { parseBrandSocialConnect, type BrandSocialConnect } from "./brandSocialConnect";
import type { HomepageConfig } from "../types/homepage";
import type { PublicSeoCenter } from "./publicSeo";
export type PublicSeoRemoteEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  portalBaseDomain?: string;
  vercelEnv?: string;
};

export type PublicSeoPageData = {
  config?: HomepageConfig | null;
  programs?: PublicCurriculumProgram[];
  legalPages?: BrandLegalPages;
  socialConnect?: BrandSocialConnect;
  center?: PublicSeoCenter | null;
  brandName?: string | null;
};

export function readPublicSeoEnv(): PublicSeoRemoteEnv {
  const env = typeof process !== "undefined" ? process.env : {};
  let viteUrl = "";
  let viteKey = "";
  let viteBase = "";
  try {
    viteUrl = String((import.meta as ImportMeta).env?.VITE_SUPABASE_URL ?? "").trim();
    viteKey = String((import.meta as ImportMeta).env?.VITE_SUPABASE_ANON_KEY ?? "").trim();
    viteBase = String((import.meta as ImportMeta).env?.VITE_PORTAL_BASE_DOMAIN ?? "").trim();
  } catch {
    /* Node / Vercel */
  }
  return {
    supabaseUrl: viteUrl || String(env.VITE_SUPABASE_URL ?? env.SUPABASE_URL ?? "").trim(),
    supabaseAnonKey: viteKey || String(env.VITE_SUPABASE_ANON_KEY ?? env.SUPABASE_ANON_KEY ?? "").trim(),
    portalBaseDomain: viteBase || String(env.VITE_PORTAL_BASE_DOMAIN ?? "").trim() || undefined,
    vercelEnv: String(env.VERCEL_ENV ?? env.VITE_VERCEL_ENV ?? "").trim() || undefined,
  };
}

/** Server / Vercel path: anon RPC without the browser Supabase singleton. */
export async function loadPublicSeoPageDataRemote(
  env: PublicSeoRemoteEnv,
  portal: "platform" | "brand" | "center" | "learn" | "parents",
  brandSlug: string | null,
  centerSlug: string | null
): Promise<PublicSeoPageData> {
  if (!env.supabaseUrl || !env.supabaseAnonKey) return {};
  const sb = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (portal === "platform") {
    const { data } = await sb.from("platform_settings").select("value").eq("key", "marketing_homepage").maybeSingle();
    const stored = (data?.value ?? null) as Partial<HomepageConfig> | null;
    const legalRes = await sb.from("platform_settings").select("value").eq("key", "marketing_legal_pages").maybeSingle();
    const legalPages = parseBrandLegalPagesRecord(
      legalRes.data?.value && typeof legalRes.data.value === "object"
        ? (legalRes.data.value as Record<string, unknown>)
        : {}
    );
    return {
      config: stored as HomepageConfig | null,
      legalPages,
      brandName: stored?.meta?.siteName ?? "EduNudg",
    };
  }

  if (portal === "brand" && brandSlug) {
    const { data } = await sb.rpc("get_brand_landing_public", { p_brand_slug: brandSlug });
    if (!data || typeof data !== "object") return {};
    const row = data as Record<string, unknown>;
    const landing = (row.landing ?? null) as HomepageConfig | null;
    return {
      config: landing,
      programs: parsePublicCurriculum(row.curriculum),
      legalPages: parseBrandLegalPagesRecord((row.legal_pages as Record<string, unknown>) ?? {}),
      socialConnect: parseBrandSocialConnect(
        row.social_connect && typeof row.social_connect === "object"
          ? { social_connect: row.social_connect as Record<string, unknown> }
          : undefined,
        landing ?? undefined
      ),
      brandName: (row.brand_name as string | undefined) ?? landing?.meta?.siteName ?? null,
    };
  }

  if (portal === "center" && brandSlug && centerSlug) {
    const { data } = await sb.rpc("get_center_landing_public", {
      p_brand_slug: brandSlug,
      p_center_slug: centerSlug,
    });
    if (!data || typeof data !== "object") return {};
    const row = data as Record<string, unknown>;
    const landing = (row.landing ?? null) as HomepageConfig | null;
    return {
      config: landing,
      programs: parsePublicCurriculum(row.curriculum),
      legalPages: parseBrandLegalPagesRecord((row.legal_pages as Record<string, unknown>) ?? {}),
      socialConnect: parseBrandSocialConnect(
        row.social_connect && typeof row.social_connect === "object"
          ? { social_connect: row.social_connect as Record<string, unknown> }
          : undefined,
        landing ?? undefined
      ),
      brandName: (row.brand_name as string | undefined) ?? null,
      center: {
        name: String(row.center_display_name || row.center_name || centerSlug),
        city: (row.center_city as string | null) ?? null,
        addressLine1: (row.center_address_line1 as string | null) ?? null,
        phone: (row.center_contact_phone as string | null) ?? null,
        region: (row.center_region as string | null) ?? null,
        pincode: (row.center_pincode as string | null) ?? null,
        shortDescription: (row.center_short_description as string | null) ?? null,
      },
    };
  }

  return {};
}
