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

function mapRow(row: BrandingRow | null): PortalBranding {
  if (!row?.brand_name) return EMPTY;
  return {
    brandId: row.brand_id ?? null,
    brandSlug: row.brand_slug ?? null,
    brandName: row.brand_name ?? null,
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

  try {
    const { data, error } = await getSupabase().rpc("get_portal_branding", {
      p_brand_slug: brandSlug,
      p_center_slug: centerSlug,
    });
    if (error) return EMPTY;
    return mapRow((data as BrandingRow | null) ?? null);
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
};

const PLATFORM_COPY: LoginBrandingCopy = {
  productName: "EduNudg",
  logoUrl: null,
  headline: "Run your franchise network with confidence",
  subtext:
    "The learning OS for platform owners, brands, centers, and families—built for scale and tenant isolation.",
  accountTitle: "Welcome back!",
  accountSubtitle: "Log in to your EduNudg platform account",
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
    return {
      productName: centerName,
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
    return {
      productName: brandName,
      logoUrl: row.brandLogoUrl,
      headline: row.loginHeadline ?? `Learn with ${brandName}`,
      subtext:
        row.loginSubtext ??
        "Your student portal for lessons, progress, and practice—all in one place.",
      accountTitle: "Welcome back!",
      accountSubtitle: `Log in to your ${brandName} student account`,
    };
  }

  if (portalType === "parents") {
    return {
      productName: brandName,
      logoUrl: row.brandLogoUrl,
      headline: row.loginHeadline ?? `Stay connected with ${brandName}`,
      subtext:
        row.loginSubtext ??
        "View progress, schedules, and updates for your learner—securely and simply.",
      accountTitle: "Welcome back!",
      accountSubtitle: `Log in to your ${brandName} parent account`,
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
  };
}

export function resolveShellProductName(
  portalType: PortalType,
  row: PortalBranding,
  brandSlug: string | null,
  centerSlug: string | null
): { productName: string; logoUrl: string | null } {
  const login = resolveLoginBranding(portalType, row, brandSlug, centerSlug);
  return { productName: login.productName, logoUrl: login.logoUrl };
}
