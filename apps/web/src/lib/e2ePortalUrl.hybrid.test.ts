/**
 * Unit coverage for E2E portal URL helpers (hybrid CI overrides vs local hosts).
 * Mirrors e2e/helpers/portal.ts logic without importing Playwright.
 */
import { describe, expect, it, afterEach } from "vitest";

const BASE = "http://127.0.0.1:9000";

function brandUrl(brandSlug: string, path = "/", useLocal = false): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (useLocal) {
    return `http://${brandSlug}.localhost:9000${normalized}`;
  }
  const url = new URL(normalized, BASE);
  url.searchParams.set("portal", "brand");
  url.searchParams.set("brand", brandSlug);
  return url.toString();
}

function centerUrl(brandSlug: string, centerSlug: string, path = "/", useLocal = false): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (useLocal) {
    return `http://${centerSlug}.${brandSlug}.localhost:9000${normalized}`;
  }
  const url = new URL(normalized, BASE);
  url.searchParams.set("portal", "center");
  url.searchParams.set("brand", brandSlug);
  url.searchParams.set("center", centerSlug);
  return url.toString();
}

describe("e2e portal URL hybrid helpers", () => {
  afterEach(() => {
    delete process.env.E2E_USE_LOCAL_HOSTS;
  });

  it("CI mode uses portal query overrides for brand/center", () => {
    expect(brandUrl("abacusworld", "/app/leads")).toBe(
      "http://127.0.0.1:9000/app/leads?portal=brand&brand=abacusworld"
    );
    expect(centerUrl("abacusworld", "koramangala", "/#register")).toBe(
      "http://127.0.0.1:9000/?portal=center&brand=abacusworld&center=koramangala#register"
    );
  });

  it("local hosts mode uses subdomains", () => {
    expect(brandUrl("abacusworld", "/login", true)).toBe("http://abacusworld.localhost:9000/login");
    expect(centerUrl("abacusworld", "koramangala", "/app", true)).toBe(
      "http://koramangala.abacusworld.localhost:9000/app"
    );
  });
});
