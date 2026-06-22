import type { PlatformIntegrationKey } from "./platformIntegrations";

export const PLATFORM_AUTH_SETTING_KEYS = [
  "auth_email",
  "auth_google",
  "auth_whatsapp_otp",
  "passkeys",
] as const satisfies readonly PlatformIntegrationKey[];

export type PlatformAuthSettingKey = (typeof PLATFORM_AUTH_SETTING_KEYS)[number];

export const PLATFORM_AUTH_SETTING_LABELS: Record<
  PlatformAuthSettingKey,
  { title: string; description: string; icon: string }
> = {
  auth_email: {
    title: "Email & Password",
    description: "Standard login method for all franchise accounts.",
    icon: "✉",
  },
  auth_google: {
    title: "Google SSO",
    description: "Enable one-tap login via Google Workspace.",
    icon: "G",
  },
  auth_whatsapp_otp: {
    title: "WhatsApp OTP",
    description: "Send one-time passcodes via WhatsApp for 2FA.",
    icon: "💬",
  },
  passkeys: {
    title: "Passkeys",
    description: "Next-gen biometric authentication for higher security.",
    icon: "⦿",
  },
};

export const PLATFORM_PUBLIC_SETTING_KEYS = [
  "platform_brand_signup",
  "public_pricing",
] as const satisfies readonly PlatformIntegrationKey[];

export type PlatformPublicSettingKey = (typeof PLATFORM_PUBLIC_SETTING_KEYS)[number];

export const PLATFORM_PUBLIC_SETTING_LABELS: Record<
  PlatformPublicSettingKey,
  { title: string; description: string }
> = {
  platform_brand_signup: {
    title: "Brand Signup Forms",
    description: "Allow new prospects to apply via the landing page.",
  },
  public_pricing: {
    title: "Public Pricing Section",
    description: "Show standard tier pricing to guest visitors.",
  },
};

export function paymentGatewayConnected(flags: Record<PlatformIntegrationKey, boolean>): boolean {
  return flags.payment_gateway;
}

export function maskedPaymentKey(key = "pk_live_4892"): string {
  return `pk_live_...${key.slice(-4)}`;
}

export function platformSettingsDomain(): string {
  if (typeof window !== "undefined" && window.location.hostname) {
    return window.location.hostname;
  }
  return "manage.franchiseos.com";
}

export function paymentVolumeLabel(): string {
  return "$124,502.00";
}

export function paymentSuccessRateLabel(): string {
  return "99.8%";
}

export function integrationsDirty(
  current: Record<PlatformIntegrationKey, boolean>,
  saved: Record<PlatformIntegrationKey, boolean>
): boolean {
  return PLATFORM_AUTH_SETTING_KEYS.some((key) => current[key] !== saved[key])
    || PLATFORM_PUBLIC_SETTING_KEYS.some((key) => current[key] !== saved[key])
    || current.payment_gateway !== saved.payment_gateway;
}
