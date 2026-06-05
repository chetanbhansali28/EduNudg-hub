import { describe, expect, it } from "vitest";
import {
  mergePlatformIntegrations,
  resolvePlatformIntegration,
  PLATFORM_INTEGRATION_DEFAULTS,
} from "./platformIntegrations";

describe("platformIntegrations", () => {
  it("uses defaults when key is missing from storage", () => {
    expect(resolvePlatformIntegration(undefined, "auth_whatsapp_otp")).toBe(false);
    expect(resolvePlatformIntegration(undefined, "auth_email")).toBe(true);
  });

  it("merges stored values over defaults", () => {
    const merged = mergePlatformIntegrations({ payment_gateway: true, auth_email: false });
    expect(merged.payment_gateway).toBe(true);
    expect(merged.auth_email).toBe(false);
    expect(merged.public_pricing).toBe(PLATFORM_INTEGRATION_DEFAULTS.public_pricing);
  });
});
