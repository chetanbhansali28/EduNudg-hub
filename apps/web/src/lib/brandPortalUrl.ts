/**
 * Builds the brand portal (backend) origin for the current environment.
 * Dev: http://{slug}.localhost:9000/
 * Prod: http://{slug}.{parent-domain}/ when admin is on a subdomain.
 */
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
  const { protocol, port } = window.location;
  const hostname = brandPortalHostname(slug, preferredHostname);
  const portSuffix = port && port !== "80" && port !== "443" ? `:${port}` : "";
  return `${protocol}//${hostname}${portSuffix}/`;
}
