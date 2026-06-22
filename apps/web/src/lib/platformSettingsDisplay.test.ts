import { describe, expect, it } from "vitest";
import {
  integrationsDirty,
  maskedPaymentKey,
  paymentGatewayConnected,
  platformSettingsDomain,
} from "./platformSettingsDisplay";
import { mergePlatformIntegrations } from "./platformIntegrations";

describe("platformSettingsDisplay", () => {
  it("detects dirty integration state", () => {
    const saved = mergePlatformIntegrations(undefined);
    const changed = { ...saved, auth_whatsapp_otp: true };
    expect(integrationsDirty(changed, saved)).toBe(true);
    expect(integrationsDirty(saved, saved)).toBe(false);
  });

  it("formats payment gateway labels", () => {
    const flags = mergePlatformIntegrations({ payment_gateway: true });
    expect(paymentGatewayConnected(flags)).toBe(true);
    expect(maskedPaymentKey()).toMatch(/^pk_live_\.\.\./);
    expect(platformSettingsDomain()).toBeTruthy();
  });
});
