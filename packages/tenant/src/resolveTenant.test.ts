import { describe, expect, it } from "vitest";
import { resolveTenantFromHost } from "./index";

describe("resolveTenantFromHost", () => {
  it("resolves platform localhost", () => {
    const t = resolveTenantFromHost("localhost");
    expect(t.portalType).toBe("platform");
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
