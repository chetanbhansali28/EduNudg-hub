/** Platform-wide integration toggles stored in platform_settings key `integrations`. */

export type PlatformIntegrationKey =
  | "auth_email"
  | "auth_google"
  | "auth_facebook"
  | "auth_whatsapp_otp"
  | "passkeys"
  | "payment_gateway"
  | "platform_brand_signup"
  | "public_pricing";

export type PlatformIntegrationMeta = {
  key: PlatformIntegrationKey;
  label: string;
  description: string;
  category: "Authentication" | "Payments" | "Public website";
};

export const PLATFORM_INTEGRATION_CATALOG: PlatformIntegrationMeta[] = [
  {
    key: "auth_email",
    label: "Email & password login",
    description: "Staff sign-in with email and password on all portals.",
    category: "Authentication",
  },
  {
    key: "auth_google",
    label: "Google sign-in",
    description: "OAuth login with Google accounts.",
    category: "Authentication",
  },
  {
    key: "auth_facebook",
    label: "Facebook sign-in",
    description: "OAuth login with Facebook accounts.",
    category: "Authentication",
  },
  {
    key: "auth_whatsapp_otp",
    label: "WhatsApp OTP login",
    description: "Phone OTP via WhatsApp for student and alternate sign-in.",
    category: "Authentication",
  },
  {
    key: "passkeys",
    label: "Passkeys (WebAuthn)",
    description: "Passwordless passkey sign-in when the passkey Edge Function is configured.",
    category: "Authentication",
  },
  {
    key: "payment_gateway",
    label: "Payment gateway",
    description: "Brand platform subscription checkout (Razorpay or stub). Data is kept when off.",
    category: "Payments",
  },
  {
    key: "platform_brand_signup",
    label: "Public brand signup",
    description: "Homepage form for new education brands to request an EduNudg account.",
    category: "Public website",
  },
  {
    key: "public_pricing",
    label: "Public pricing section",
    description: "Subscription plans on the platform marketing homepage.",
    category: "Public website",
  },
];

/** Defaults match current production behaviour; new keys should default false. */
export const PLATFORM_INTEGRATION_DEFAULTS: Record<PlatformIntegrationKey, boolean> = {
  auth_email: true,
  auth_google: true,
  auth_facebook: true,
  auth_whatsapp_otp: false,
  passkeys: false,
  payment_gateway: false,
  platform_brand_signup: true,
  public_pricing: true,
};

export function resolvePlatformIntegration(
  stored: Record<string, boolean> | undefined,
  key: PlatformIntegrationKey
): boolean {
  if (stored && key in stored) return Boolean(stored[key]);
  return PLATFORM_INTEGRATION_DEFAULTS[key];
}

export function mergePlatformIntegrations(
  stored: Record<string, boolean> | undefined
): Record<PlatformIntegrationKey, boolean> {
  const merged = {} as Record<PlatformIntegrationKey, boolean>;
  for (const meta of PLATFORM_INTEGRATION_CATALOG) {
    merged[meta.key] = resolvePlatformIntegration(stored, meta.key);
  }
  return merged;
}

export function integrationsByCategory(): Record<
  PlatformIntegrationMeta["category"],
  PlatformIntegrationMeta[]
> {
  const grouped = {
    Authentication: [] as PlatformIntegrationMeta[],
    Payments: [] as PlatformIntegrationMeta[],
    "Public website": [] as PlatformIntegrationMeta[],
  };
  for (const meta of PLATFORM_INTEGRATION_CATALOG) {
    grouped[meta.category].push(meta);
  }
  return grouped;
}
