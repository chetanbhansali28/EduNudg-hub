/**
 * Identify brands / signups created by ephemeral E2E runs so they can be
 * permanently purged without touching seeded tenants (abacusworld, smart-brain-abacus).
 */
export const E2E_SEED_BRAND_SLUGS = ["abacusworld", "smart-brain-abacus"] as const;

/** Organization names created by e2e-01: `E2E Brand ${suffix}`. */
export function isE2EEphemeralBrandName(name: string | null | undefined): boolean {
  if (!name) return false;
  return /^E2E Brand\b/i.test(name.trim());
}

/** Slugs from approve_platform_brand_signup(slugify(name)-city): `e2e-brand-…-bengaluru`. */
export function isE2EEphemeralBrandSlug(slug: string | null | undefined): boolean {
  if (!slug) return false;
  const normalized = slug.trim().toLowerCase();
  if ((E2E_SEED_BRAND_SLUGS as readonly string[]).includes(normalized)) return false;
  return /^e2e-brand-/.test(normalized);
}

/** Work emails from e2e-01: `e2e-brand-${suffix}@example.com`. */
export function isE2EEphemeralSignupEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return /^e2e-brand-.+@example\.com$/i.test(email.trim());
}

export function isProtectedSeedBrandSlug(slug: string | null | undefined): boolean {
  if (!slug) return false;
  return (E2E_SEED_BRAND_SLUGS as readonly string[]).includes(slug.trim().toLowerCase());
}
