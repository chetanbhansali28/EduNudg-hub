import type { PortalType } from "@edunudg/tenant";
import { getSupabase } from "@/lib/supabase";
export type PortalBranding = {
  brandId: string | null;
  brandSlug: string | null;
  brandName: string | null;
  brandLogoUrl: string | null;
  centerId: string | null;
  centerSlug: string | null;
  centerName: string | null;
  loginHeadline: string | null;
  loginSubtext: string | null;
};

type BrandingRow = {
  brand_id?: string | null;
  brand_slug?: string | null;
  brand_name?: string | null;
  brand_logo_url?: string | null;
  center_id?: string | null;
  center_slug?: string | null;
  center_name?: string | null;
  login_headline?: string | null;
  login_subtext?: string | null;
};

const EMPTY: PortalBranding = {
  brandId: null,
  brandSlug: null,
  brandName: null,
  brandLogoUrl: null,
  centerId: null,
  centerSlug: null,
  centerName: null,
  loginHeadline: null,
  loginSubtext: null,
};

function portalBrandingCacheKey(brandSlug: string, centerSlug: string | null): string {
  return `${brandSlug}:${centerSlug ?? ""}`;
}

const portalBrandingCache = new Map<string, PortalBranding>();

export function seedPortalBrandingCache(
  brandSlug: string,
  centerSlug: string | null,
  branding: PortalBranding
): void {
  portalBrandingCache.set(portalBrandingCacheKey(brandSlug, centerSlug), branding);
}

export function readPortalBrandingCache(
  brandSlug: string,
  centerSlug: string | null
): PortalBranding | undefined {
  return portalBrandingCache.get(portalBrandingCacheKey(brandSlug, centerSlug));
}

export function clearPortalBrandingCache(): void {
  portalBrandingCache.clear();
}

export function parsePortalBrandingRpc(data: unknown): PortalBranding {
  if (!data || typeof data !== "object") return EMPTY;
  const row = data as BrandingRow;
  if (!row.brand_id && !row.brand_name && !row.brand_slug) return EMPTY;
  return {
    brandId: row.brand_id ?? null,
    brandSlug: row.brand_slug ?? null,
    brandName: row.brand_name ?? row.brand_slug ?? null,
    brandLogoUrl: row.brand_logo_url ?? null,
    centerId: row.center_id ?? null,
    centerSlug: row.center_slug ?? null,
    centerName: row.center_name ?? null,
    loginHeadline: row.login_headline ?? null,
    loginSubtext: row.login_subtext ?? null,
  };
}

export async function fetchPortalBranding(
  brandSlug: string | null,
  centerSlug: string | null
): Promise<PortalBranding> {
  if (!brandSlug) return EMPTY;

  const cached = readPortalBrandingCache(brandSlug, centerSlug);
  if (cached) return cached;

  try {
    const { data, error } = await getSupabase().rpc("get_portal_branding", {
      p_brand_slug: brandSlug,
      p_center_slug: centerSlug,
    });
    if (error) return EMPTY;
    const branding = parsePortalBrandingRpc(data);
    seedPortalBrandingCache(brandSlug, centerSlug, branding);
    return branding;
  } catch {
    return EMPTY;
  }
}

export type LoginBrandingCopy = {
  productName: string;
  logoUrl: string | null;
  headline: string;
  subtext: string;
  accountTitle: string;
  accountSubtitle: string;
  portalTagline: string | null;
};

const PLATFORM_COPY: LoginBrandingCopy = {
  productName: "EduNudg",
  logoUrl: null,
  headline: "Run your franchise network with confidence",
  subtext:
    "The learning OS for platform owners, brands, centers, and families—built for scale and tenant isolation.",
  accountTitle: "Welcome back!",
  accountSubtitle: "Log in to your EduNudg platform account",
  portalTagline: null,
};

export function resolveLoginBranding(
  portalType: PortalType,
  row: PortalBranding,
  brandSlug: string | null,
  centerSlug: string | null
): LoginBrandingCopy {
  if (portalType === "platform") {
    return PLATFORM_COPY;
  }

  const brandName =
    row.brandName ?? (brandSlug ? brandSlug.replace(/-/g, " ") : "Your brand");
  const centerName =
    row.centerName ?? (centerSlug ? centerSlug.replace(/-/g, " ") : null);

  if (portalType === "center" && centerName) {
    const lockup = franchiseBrandLockup(centerName, brandName);
    return {
      productName: lockup.primaryName,
      portalTagline: lockup.byline,
      logoUrl: row.brandLogoUrl,
      headline: row.loginHeadline ?? `Welcome to ${centerName}`,
      subtext:
        row.loginSubtext ??
        `Sign in to manage admissions, students, and daily operations for ${brandName}.`,
      accountTitle: "Welcome back!",
      accountSubtitle: `Log in to your ${centerName} account`,
    };
  }

  if (portalType === "learn") {
    const lockup = franchiseBrandLockup(centerName, brandName);
    return {
      productName: lockup.primaryName,
      portalTagline: lockup.byline,
      logoUrl: row.brandLogoUrl,
      headline: row.loginHeadline ?? `Learn with ${lockup.primaryName}`,
      subtext:
        row.loginSubtext ??
        "Your student portal for lessons, progress, and practice—all in one place.",
      accountTitle: "Welcome back!",
      accountSubtitle: `Log in to your ${lockup.primaryName} student account`,
    };
  }

  if (portalType === "parents") {
    const lockup = franchiseBrandLockup(centerName, brandName);
    return {
      productName: lockup.primaryName,
      portalTagline: lockup.byline,
      logoUrl: row.brandLogoUrl,
      headline: row.loginHeadline ?? `Stay connected with ${lockup.primaryName}`,
      subtext:
        row.loginSubtext ??
        "View progress, schedules, and updates for your learner—securely and simply.",
      accountTitle: "Welcome back!",
      accountSubtitle: `Log in to your ${lockup.primaryName} parent account`,
    };
  }

  return {
    productName: brandName,
    logoUrl: row.brandLogoUrl,
    headline: row.loginHeadline ?? `Lead ${brandName} with clarity`,
    subtext:
      row.loginSubtext ??
      "Curriculum, centers, royalties, and analytics—one calm command center for your franchise network.",
    accountTitle: "Welcome back!",
    accountSubtitle: `Log in to your ${brandName} brand account`,
    portalTagline: null,
  };
}

export type ShellLockup = {
  productName: string;
  logoUrl: string | null;
  portalTagline: string | null;
  franchiseName: string | null;
};

export type FranchiseBrandLockup = {
  primaryName: string;
  byline: string | null;
  accessibleName: string;
};

/** Franchise name on line 1, “by {brand}” on line 2 when the names differ. */
export function franchiseBrandLockup(
  franchiseName: string | null | undefined,
  brandName: string | null | undefined
): FranchiseBrandLockup {
  const franchise = franchiseName?.trim() || "";
  const brand = brandName?.trim() || "";
  if (!franchise && !brand) {
    return { primaryName: "EduNudg", byline: null, accessibleName: "EduNudg" };
  }
  if (!franchise) {
    return { primaryName: brand, byline: null, accessibleName: brand };
  }
  if (!brand || franchise.toLowerCase() === brand.toLowerCase()) {
    return { primaryName: franchise, byline: null, accessibleName: franchise };
  }
  return {
    primaryName: franchise,
    byline: `by ${brand}`,
    accessibleName: `${franchise} by ${brand}`,
  };
}

function displaySlugName(slug: string | null, fallback: string): string {
  return slug ? slug.replace(/-/g, " ") : fallback;
}

function brandDisplayName(row: PortalBranding, brandSlug: string | null): string {
  return row.brandName ?? displaySlugName(brandSlug, "Your brand");
}

function applyFranchiseLockup(
  logoUrl: string | null,
  franchiseName: string,
  brandName: string
): ShellLockup {
  const lockup = franchiseBrandLockup(franchiseName, brandName);
  return {
    productName: lockup.primaryName,
    logoUrl,
    portalTagline: lockup.byline,
    franchiseName,
  };
}

export function resolveShellProductName(
  portalType: PortalType,
  row: PortalBranding,
  brandSlug: string | null,
  centerSlug: string | null,
  extras?: { franchiseName?: string | null }
): ShellLockup {
  const login = resolveLoginBranding(portalType, row, brandSlug, centerSlug);
  const brandName = brandDisplayName(row, brandSlug);
  const franchiseName =
    extras?.franchiseName?.trim() ||
    row.centerName?.trim() ||
    (portalType === "center" ? displaySlugName(centerSlug, "") : "");

  if (portalType === "center" && franchiseName) {
    return applyFranchiseLockup(login.logoUrl, franchiseName, brandName);
  }

  if ((portalType === "learn" || portalType === "parents") && franchiseName) {
    return applyFranchiseLockup(login.logoUrl, franchiseName, brandName);
  }

  return {
    productName: login.productName,
    logoUrl: login.logoUrl,
    portalTagline: null,
    franchiseName: franchiseName || null,
  };
}
