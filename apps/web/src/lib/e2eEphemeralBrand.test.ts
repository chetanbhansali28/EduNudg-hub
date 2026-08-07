import { describe, expect, it } from "vitest";
import {
  isE2EEphemeralBrandName,
  isE2EEphemeralBrandSlug,
  isE2EEphemeralSignupEmail,
  isProtectedSeedBrandSlug,
} from "./e2eEphemeralBrand";

describe("regression_e2eEphemeralBrandMatchers", () => {
  it("matches e2e-01 org names and emails without flagging seeds", () => {
    expect(isE2EEphemeralBrandName("E2E Brand m1k2n3")).toBe(true);
    expect(isE2EEphemeralBrandName("Abacus World")).toBe(false);
    expect(isE2EEphemeralSignupEmail("e2e-brand-m1k2n3@example.com")).toBe(true);
    expect(isE2EEphemeralSignupEmail("owner@edunudg.com")).toBe(false);
  });

  it("matches approved e2e slugs and protects seeded tenants", () => {
    expect(isE2EEphemeralBrandSlug("e2e-brand-m1k2n3-bengaluru")).toBe(true);
    expect(isE2EEphemeralBrandSlug("e2e-brand-m1k2n3-bengaluru-2")).toBe(true);
    expect(isE2EEphemeralBrandSlug("abacusworld")).toBe(false);
    expect(isE2EEphemeralBrandSlug("smart-brain-abacus")).toBe(false);
    expect(isProtectedSeedBrandSlug("abacusworld")).toBe(true);
  });
});
