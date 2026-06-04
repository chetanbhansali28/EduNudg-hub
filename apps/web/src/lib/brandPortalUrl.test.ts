import { afterEach, describe, expect, it } from "vitest";
import { brandPortalHostname, brandPortalUrl, centerPortalUrl } from "./brandPortalUrl";

describe("brandPortalUrl", () => {
  const original = window.location;

  afterEach(() => {
    Object.defineProperty(window, "location", { value: original, writable: true });
  });

  function mockLocation(hostname: string, port = "9000") {
    Object.defineProperty(window, "location", {
      value: { protocol: "http:", hostname, port },
      writable: true,
    });
  }

  it("uses slug.localhost on platform localhost", () => {
    mockLocation("localhost");
    expect(brandPortalHostname("abacusworld")).toBe("abacusworld.localhost");
    expect(brandPortalUrl("abacusworld")).toBe("http://abacusworld.localhost:9000/");
  });

  it("prefers mapped hostname when provided", () => {
    mockLocation("localhost");
    expect(brandPortalUrl("abacusworld", "custom-brand.example.com")).toBe(
      "http://custom-brand.example.com:9000/"
    );
  });

  it("regression_brand_portal_url_strips_admin_subdomain", () => {
    mockLocation("admin.edunudg.com", "");
    expect(brandPortalHostname("acme")).toBe("acme.edunudg.com");
    expect(brandPortalUrl("acme")).toBe("http://acme.edunudg.com/");
  });

  it("builds center portal url from brand and center slugs", () => {
    mockLocation("localhost");
    expect(centerPortalUrl("abacusworld", "koramangala")).toBe(
      "http://koramangala.abacusworld.localhost:9000/"
    );
  });
});
