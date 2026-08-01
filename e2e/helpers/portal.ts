/**
 * E2E portal URL helpers.
 *
 * Default (CI): same-origin portal overrides on baseURL (127.0.0.1:9000).
 * Local UAT: set E2E_USE_LOCAL_HOSTS=1 to use *.localhost:9000 subdomains.
 */

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:9000";

export function useLocalHosts(): boolean {
  return process.env.E2E_USE_LOCAL_HOSTS === "1" || process.env.E2E_USE_LOCAL_HOSTS === "true";
}

function originForHost(hostname: string): string {
  const url = new URL(BASE);
  return `${url.protocol}//${hostname}${url.port ? `:${url.port}` : ""}`;
}

export function platformUrl(path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalized, BASE).toString();
}

export function brandUrl(brandSlug: string, path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (useLocalHosts()) {
    return `${originForHost(`${brandSlug}.localhost`)}${normalized}`;
  }
  const url = new URL(normalized, BASE);
  url.searchParams.set("portal", "brand");
  url.searchParams.set("brand", brandSlug);
  return url.toString();
}

export function centerUrl(brandSlug: string, centerSlug: string, path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (useLocalHosts()) {
    return `${originForHost(`${centerSlug}.${brandSlug}.localhost`)}${normalized}`;
  }
  const url = new URL(normalized, BASE);
  url.searchParams.set("portal", "center");
  url.searchParams.set("brand", brandSlug);
  url.searchParams.set("center", centerSlug);
  return url.toString();
}

export function learnUrl(brandSlug: string, path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (useLocalHosts()) {
    return `${originForHost(`learn.${brandSlug}.localhost`)}${normalized}`;
  }
  const url = new URL(normalized, BASE);
  url.searchParams.set("portal", "learn");
  url.searchParams.set("brand", brandSlug);
  return url.toString();
}

/** Seeded demo tenants (test-users.sql). */
export const SEED = {
  brandSlug: "abacusworld",
  centerSlug: "koramangala",
  brandId: "a0000000-0000-4000-8000-000000000001",
  centerId: "b0000000-0000-4000-8000-000000000001",
} as const;
