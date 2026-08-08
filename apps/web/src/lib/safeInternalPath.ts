/** Relative in-app path safe for post-login redirects (blocks protocol-relative // open redirects). */
export function isSafeInternalPath(path: string | null | undefined): path is string {
  if (!path) return false;
  const trimmed = path.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return false;
  if (trimmed.includes("\\") || trimmed.includes("://")) return false;
  return true;
}

export function resolveSafeInternalPath(path: string | null | undefined, fallback: string): string {
  return isSafeInternalPath(path) ? path.trim() : fallback;
}
