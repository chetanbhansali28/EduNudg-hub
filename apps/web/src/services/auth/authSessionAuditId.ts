/** Stable id for auth audit dedup (Supabase GoTrue session_id, else user+iat). */
export function authSessionAuditId(accessToken: string | undefined, userId: string): string {
  if (!accessToken) return userId;
  const parts = accessToken.split(".");
  if (parts.length < 2) return userId;
  try {
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    const payload = JSON.parse(atob(padded)) as { session_id?: unknown; iat?: unknown };
    if (typeof payload.session_id === "string" && payload.session_id.trim()) {
      return payload.session_id.trim();
    }
    if (typeof payload.iat === "number") return `${userId}:${payload.iat}`;
  } catch {
    return userId;
  }
  return userId;
}
