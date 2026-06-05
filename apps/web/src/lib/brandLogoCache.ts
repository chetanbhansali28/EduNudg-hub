import type { QueryClient } from "@tanstack/react-query";

/** Strip an existing `?v=` cache-bust query from a stored logo URL. */
export function stripLogoCacheBust(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete("v");
    const search = parsed.searchParams.toString();
    return `${parsed.origin}${parsed.pathname}${search ? `?${search}` : ""}`;
  } catch {
    return url.split("?")[0] ?? url;
  }
}

/** Append a version query param so browsers/CDN fetch the latest logo after re-upload. */
export function withLogoCacheBust(url: string, version: number | string = Date.now()): string {
  const base = stripLogoCacheBust(url);
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}v=${encodeURIComponent(String(version))}`;
}

/** Invalidate client caches that embed `brands.logo_url` (marketing nav, login, etc.). */
export function invalidateBrandLogoCaches(qc: QueryClient, brandId?: string): void {
  void qc.invalidateQueries({ queryKey: ["brands"] });
  void qc.invalidateQueries({ queryKey: ["brand-landing"] });
  void qc.invalidateQueries({ queryKey: ["portal-branding"] });
  void qc.invalidateQueries({ queryKey: ["center-landing"] });
  void qc.invalidateQueries({ queryKey: ["brand-marketing-editor"] });
  void qc.invalidateQueries({ queryKey: ["brand"] });

  if (brandId) {
    void qc.invalidateQueries({ queryKey: ["brand-row", brandId] });
    void qc.invalidateQueries({ queryKey: ["brand-marketing-editor", brandId] });
  }
}
