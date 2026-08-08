/** OAuth return URL for staff portals — always `/login` so membership gate runs. */
export function buildStaffOAuthRedirectUrl(search = ""): string {
  const params = new URLSearchParams(search);
  const origin =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "http://localhost:9000";
  const url = new URL("/login", origin);
  const next = params.get("next");
  if (next?.startsWith("/")) {
    url.searchParams.set("next", next);
  }
  return url.toString();
}

export function isOAuthCallbackHash(hash: string): boolean {
  return hash.includes("access_token=") || hash.includes("error=");
}
