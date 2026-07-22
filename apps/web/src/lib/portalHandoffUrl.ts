/** Build the SPA handoff URL on the target portal host (before token_hash is appended). */
export function portalHandoffCallbackUrl(origin: string, nextPath: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}/auth/handoff?next=${encodeURIComponent(nextPath)}`;
}

/** Append a one-time admin handoff token for client-side verifyOtp on the target host. */
export function appendPortalHandoffToken(callbackUrl: string, tokenHash: string): string {
  const parsed = new URL(callbackUrl);
  const next = parsed.searchParams.get("next") ?? "/";
  const handoff = new URL("/auth/handoff", parsed.origin);
  handoff.searchParams.set("token_hash", tokenHash);
  handoff.searchParams.set("next", next);
  for (const key of ["portal", "brand", "center"] as const) {
    const value = parsed.searchParams.get(key);
    if (value) handoff.searchParams.set(key, value);
  }
  return handoff.toString();
}
