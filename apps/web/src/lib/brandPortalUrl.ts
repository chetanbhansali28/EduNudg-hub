/**
 * Builds portal origins for brand, center, learn, and parents hosts.
 * Dev: http://{slug}.localhost:9000/
 */

export type PortalType = "brand" | "center" | "learn" | "parents";

export type PortalTarget = {
  portalType: PortalType;
  brandSlug: string;
  centerSlug?: string | null;
  hostname?: string | null;
};

function portSuffix(): string {
  const { port } = window.location;
  return port && port !== "80" && port !== "443" ? `:${port}` : "";
}

export function brandPortalHostname(slug: string, preferredHostname?: string | null): string {
  if (preferredHostname?.trim()) return preferredHostname.trim().toLowerCase();

  const host = window.location.hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost")) {
    return `${slug}.localhost`;
  }

  const parts = host.split(".");
  if (parts[0] === "admin" && parts.length > 2) {
    return `${slug}.${parts.slice(1).join(".")}`;
  }
  if (parts.length >= 2) {
    return `${slug}.${parts.slice(-2).join(".")}`;
  }
  return `${slug}.localhost`;
}

export function brandPortalUrl(slug: string, preferredHostname?: string | null): string {
  const { protocol } = window.location;
  const hostname = brandPortalHostname(slug, preferredHostname);
  return `${protocol}//${hostname}${portSuffix()}/`;
}

/** Center marketing site on {center}.{brand}.localhost (or prod equivalent). */
export function centerPortalUrl(
  brandSlug: string,
  centerSlug: string,
  preferredHostname?: string | null
): string {
  const { protocol } = window.location;
  if (preferredHostname?.trim()) {
    return `${protocol}//${preferredHostname.trim().toLowerCase()}${portSuffix()}/`;
  }
  const brandHost = brandPortalHostname(brandSlug);
  return `${protocol}//${centerSlug}.${brandHost}${portSuffix()}/`;
}

export function learnPortalUrl(brandSlug: string, preferredHostname?: string | null): string {
  const { protocol } = window.location;
  if (preferredHostname?.trim()) {
    return `${protocol}//${preferredHostname.trim().toLowerCase()}${portSuffix()}/`;
  }
  const brandHost = brandPortalHostname(brandSlug);
  return `${protocol}//learn.${brandHost}${portSuffix()}/`;
}

export function parentsPortalUrl(brandSlug: string, preferredHostname?: string | null): string {
  const { protocol } = window.location;
  if (preferredHostname?.trim()) {
    return `${protocol}//${preferredHostname.trim().toLowerCase()}${portSuffix()}/`;
  }
  const brandHost = brandPortalHostname(brandSlug);
  return `${protocol}//parents.${brandHost}${portSuffix()}/`;
}

export function portalOriginUrl(target: PortalTarget): string {
  switch (target.portalType) {
    case "center":
      return centerPortalUrl(target.brandSlug, target.centerSlug ?? "", target.hostname);
    case "learn":
      return learnPortalUrl(target.brandSlug, target.hostname);
    case "parents":
      return parentsPortalUrl(target.brandSlug, target.hostname);
    default:
      return brandPortalUrl(target.brandSlug, target.hostname);
  }
}

/** Staff backend path after sign-in (brand/center → /app; learn/parents → /). */
export function portalBackendPath(target: PortalTarget): string {
  if (target.portalType === "learn" || target.portalType === "parents") return "/";
  return "/app";
}

export function portalBackendUrl(target: PortalTarget): string {
  const origin = portalOriginUrl(target).replace(/\/$/, "");
  const path = portalBackendPath(target);
  return `${origin}${path}`;
}

/** Callback URL on the target portal host; edge function appends token_hash for verifyOtp handoff. */
export function portalHandoffLoginUrl(target: PortalTarget): string {
  const origin = portalOriginUrl(target).replace(/\/$/, "");
  const next = portalBackendPath(target);
  return `${origin}/auth/handoff?next=${encodeURIComponent(next)}`;
}

export function portalTargetFromDomain(
  portalType: string,
  hostname: string,
  brandSlug: string
): PortalTarget | null {
  const type = portalType as PortalType;
  if (!["brand", "center", "learn", "parents"].includes(type)) return null;

  if (type === "center") {
    const centerSlug = hostname.split(".")[0] ?? "";
    if (!centerSlug) return null;
    return { portalType: "center", brandSlug, centerSlug, hostname };
  }

  return { portalType: type, brandSlug, hostname };
}
