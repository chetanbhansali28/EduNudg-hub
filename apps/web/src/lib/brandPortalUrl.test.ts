import { afterEach, describe, expect, it } from "vitest";
import {
  brandPortalHostname,
  brandPortalUrl,
  centerPortalUrl,
  learnPortalUrl,
  portalBackendUrl,
  portalHandoffLoginUrl,
  portalTargetFromDomain,
} from "./brandPortalUrl";

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

  it("regression_portal_backend_url_points_to_app_for_brand_and_center", () => {
    mockLocation("localhost");
    expect(
      portalBackendUrl({ portalType: "brand", brandSlug: "abacusworld", hostname: "abacusworld.localhost" })
    ).toBe("http://abacusworld.localhost:9000/app");
    expect(
      portalBackendUrl({
        portalType: "center",
        brandSlug: "abacusworld",
        centerSlug: "koramangala",
        hostname: "koramangala.abacusworld.localhost",
      })
    ).toBe("http://koramangala.abacusworld.localhost:9000/app");
  });

  it("regression_portal_handoff_login_url_includes_next_path", () => {
    mockLocation("localhost");
    expect(
      portalHandoffLoginUrl({ portalType: "brand", brandSlug: "smart-brain-abacus", hostname: "smart-brain-abacus.localhost" })
    ).toBe("http://smart-brain-abacus.localhost:9000/auth/handoff?next=%2Fapp");
  });

  it("regression_portal_target_from_domain_supports_center_and_learn", () => {
    expect(
      portalTargetFromDomain("center", "koramangala.abacusworld.localhost", "abacusworld")
    ).toEqual({
      portalType: "center",
      brandSlug: "abacusworld",
      centerSlug: "koramangala",
      hostname: "koramangala.abacusworld.localhost",
    });
    expect(portalTargetFromDomain("learn", "learn.abacusworld.localhost", "abacusworld")).toEqual({
      portalType: "learn",
      brandSlug: "abacusworld",
      hostname: "learn.abacusworld.localhost",
    });
  });

  it("builds learn portal url", () => {
    mockLocation("localhost");
    expect(learnPortalUrl("abacusworld")).toBe("http://learn.abacusworld.localhost:9000/");
  });
});
