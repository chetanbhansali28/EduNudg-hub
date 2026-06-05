/** Plan entitlements stored in subscription_plans.features (jsonb). */

export type SubscriptionPlanFeatures = {
  max_franchise_centers: number | null;
  max_students: number | null;
  white_labeling: boolean;
  whatsapp_operations: boolean;
  student_leads: boolean;
  franchise_applications: boolean;
  brand_billing: boolean;
  campaigns: boolean;
  kits: boolean;
  custom_domain: boolean;
  priority_support: boolean;
};

export type PublicSubscriptionPlan = {
  code: string;
  name: string;
  price_cents: number;
  currency: string;
  billing_interval: string;
  features: SubscriptionPlanFeatures;
  is_default: boolean;
};

export const DEFAULT_PLAN_FEATURES: SubscriptionPlanFeatures = {
  max_franchise_centers: 3,
  max_students: 200,
  white_labeling: false,
  whatsapp_operations: false,
  student_leads: true,
  franchise_applications: true,
  brand_billing: true,
  campaigns: false,
  kits: false,
  custom_domain: false,
  priority_support: false,
};

export const STARTER_PLAN_FEATURES: SubscriptionPlanFeatures = {
  ...DEFAULT_PLAN_FEATURES,
  max_franchise_centers: 3,
  max_students: 200,
};

export const GROWTH_PLAN_FEATURES: SubscriptionPlanFeatures = {
  ...DEFAULT_PLAN_FEATURES,
  max_franchise_centers: 15,
  max_students: 2000,
  white_labeling: true,
  whatsapp_operations: true,
  campaigns: true,
};

export const ENTERPRISE_PLAN_FEATURES: SubscriptionPlanFeatures = {
  max_franchise_centers: null,
  max_students: null,
  white_labeling: true,
  whatsapp_operations: true,
  student_leads: true,
  franchise_applications: true,
  brand_billing: true,
  campaigns: true,
  kits: true,
  custom_domain: true,
  priority_support: true,
};

export const PLAN_FEATURE_META: {
  key: keyof SubscriptionPlanFeatures;
  label: string;
  kind: "limit" | "boolean";
  description?: string;
}[] = [
  { key: "max_franchise_centers", label: "Max franchise centers", kind: "limit" },
  { key: "max_students", label: "Max students", kind: "limit" },
  { key: "white_labeling", label: "White-label branding", kind: "boolean" },
  { key: "whatsapp_operations", label: "WhatsApp operations", kind: "boolean", description: "OTP and lead WhatsApp flows" },
  { key: "student_leads", label: "Student leads module", kind: "boolean" },
  { key: "franchise_applications", label: "Franchise applications", kind: "boolean" },
  { key: "brand_billing", label: "Platform billing", kind: "boolean" },
  { key: "campaigns", label: "Campaigns module", kind: "boolean" },
  { key: "kits", label: "Kits & inventory", kind: "boolean" },
  { key: "custom_domain", label: "Custom domain", kind: "boolean" },
  { key: "priority_support", label: "Priority support", kind: "boolean" },
];

export function parsePlanFeatures(raw: unknown): SubscriptionPlanFeatures {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const num = (key: keyof SubscriptionPlanFeatures) => {
    const v = obj[key];
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const bool = (key: keyof SubscriptionPlanFeatures, fallback: boolean) => {
    const v = obj[key];
    return typeof v === "boolean" ? v : fallback;
  };
  return {
    max_franchise_centers: num("max_franchise_centers"),
    max_students: num("max_students"),
    white_labeling: bool("white_labeling", DEFAULT_PLAN_FEATURES.white_labeling),
    whatsapp_operations: bool("whatsapp_operations", DEFAULT_PLAN_FEATURES.whatsapp_operations),
    student_leads: bool("student_leads", DEFAULT_PLAN_FEATURES.student_leads),
    franchise_applications: bool("franchise_applications", DEFAULT_PLAN_FEATURES.franchise_applications),
    brand_billing: bool("brand_billing", DEFAULT_PLAN_FEATURES.brand_billing),
    campaigns: bool("campaigns", DEFAULT_PLAN_FEATURES.campaigns),
    kits: bool("kits", DEFAULT_PLAN_FEATURES.kits),
    custom_domain: bool("custom_domain", DEFAULT_PLAN_FEATURES.custom_domain),
    priority_support: bool("priority_support", DEFAULT_PLAN_FEATURES.priority_support),
  };
}

export function emptyPlanFeaturesForm(): Record<keyof SubscriptionPlanFeatures, string> {
  const f = DEFAULT_PLAN_FEATURES;
  return {
    max_franchise_centers: f.max_franchise_centers == null ? "" : String(f.max_franchise_centers),
    max_students: f.max_students == null ? "" : String(f.max_students),
    white_labeling: String(f.white_labeling),
    whatsapp_operations: String(f.whatsapp_operations),
    student_leads: String(f.student_leads),
    franchise_applications: String(f.franchise_applications),
    brand_billing: String(f.brand_billing),
    campaigns: String(f.campaigns),
    kits: String(f.kits),
    custom_domain: String(f.custom_domain),
    priority_support: String(f.priority_support),
  };
}

export function planFeaturesFromForm(form: Record<keyof SubscriptionPlanFeatures, string>): SubscriptionPlanFeatures {
  const limit = (v: string) => {
    const t = v.trim();
    if (!t) return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  };
  const flag = (v: string) => v === "true";
  return {
    max_franchise_centers: limit(form.max_franchise_centers),
    max_students: limit(form.max_students),
    white_labeling: flag(form.white_labeling),
    whatsapp_operations: flag(form.whatsapp_operations),
    student_leads: flag(form.student_leads),
    franchise_applications: flag(form.franchise_applications),
    brand_billing: flag(form.brand_billing),
    campaigns: flag(form.campaigns),
    kits: flag(form.kits),
    custom_domain: flag(form.custom_domain),
    priority_support: flag(form.priority_support),
  };
}

export function planFeaturesToForm(features: SubscriptionPlanFeatures): Record<keyof SubscriptionPlanFeatures, string> {
  return {
    max_franchise_centers: features.max_franchise_centers == null ? "" : String(features.max_franchise_centers),
    max_students: features.max_students == null ? "" : String(features.max_students),
    white_labeling: String(features.white_labeling),
    whatsapp_operations: String(features.whatsapp_operations),
    student_leads: String(features.student_leads),
    franchise_applications: String(features.franchise_applications),
    brand_billing: String(features.brand_billing),
    campaigns: String(features.campaigns),
    kits: String(features.kits),
    custom_domain: String(features.custom_domain),
    priority_support: String(features.priority_support),
  };
}

export function formatPlanLimit(value: number | null, unit: string): string {
  if (value == null) return `Unlimited ${unit}`;
  return `Up to ${value.toLocaleString("en-IN")} ${unit}`;
}

export function pricingFeatureBullets(features: SubscriptionPlanFeatures): string[] {
  const bullets: string[] = [
    formatPlanLimit(features.max_franchise_centers, "franchise centers"),
    formatPlanLimit(features.max_students, "students"),
  ];
  for (const meta of PLAN_FEATURE_META) {
    if (meta.kind !== "boolean") continue;
    if (features[meta.key]) bullets.push(meta.label);
  }
  return bullets;
}
