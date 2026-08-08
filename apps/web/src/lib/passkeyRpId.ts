/** WebAuthn RP ID for the current browser host (localhost subdomains → localhost). */
export function resolvePasskeyRpId(hostname: string): string {
  const host = hostname.split(":")[0].toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost")) {
    return "localhost";
  }
  return host;
}

export function passkeyOrigin(): string {
  if (typeof window === "undefined") return "http://localhost:9000";
  return window.location.origin;
}

export function isPasskeySupported(): boolean {
  return typeof window !== "undefined" && typeof window.PublicKeyCredential !== "undefined";
}
