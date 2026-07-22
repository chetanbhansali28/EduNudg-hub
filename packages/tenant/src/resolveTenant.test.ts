import { describe, expect, it } from "vitest";
import { isPlatformHost, resolveTenantFromHost } from "./index";

describe("resolveTenantFromHost", () => {
  it("resolves platform localhost", () => {
    const t = resolveTenantFromHost("localhost");
    expect(t.portalType).toBe("platform");
  });

  it("regression_vercel_app_host_resolves_platform", () => {
    const t = resolveTenantFromHost("edunudg-hub.vercel.app");
    expect(t.portalType).toBe("platform");
    expect(t.brandSlug).toBeNull();
    expect(t.centerSlug).toBeNull();
  });

  it("regression_vercel_preview_host_resolves_platform", () => {
    const t = resolveTenantFromHost(
      "edunudg-hub-git-main-chetanbhansali-3860s-projects.vercel.app"
    );
    expect(t.portalType).toBe("platform");
  });

  it("regression_admin_platform_host_resolves_platform", () => {
    const t = resolveTenantFromHost("admin.edunudg.com");
    expect(t.portalType).toBe("platform");
    expect(t.brandSlug).toBeNull();
  });

  it("resolves brand subdomain", () => {
    const t = resolveTenantFromHost("abacusworld.localhost");
    expect(t.portalType).toBe("brand");
    expect(t.brandSlug).toBe("abacusworld");
  });

  it("resolves center subdomain", () => {
    const t = resolveTenantFromHost("koramangala.abacusworld.localhost");
    expect(t.portalType).toBe("center");
    expect(t.centerSlug).toBe("koramangala");
    expect(t.brandSlug).toBe("abacusworld");
  });
});

describe("isPlatformHost", () => {
  it("recognizes vercel deployment hosts", () => {
    expect(isPlatformHost("edunudg-hub.vercel.app")).toBe(true);
  });
});
