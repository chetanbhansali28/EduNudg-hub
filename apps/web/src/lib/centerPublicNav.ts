import type { HomepageConfig } from "@/types/homepage";

function isEnrollNavLink(link: { label: string; href: string }): boolean {
  return link.label.trim().toLowerCase() === "enroll";
}

function normalizeHref(href: string): string {
  return href.trim().toLowerCase().replace(/^#/, "");
}

/** Franchise apply is brand-only — centers must not surface apply CTAs or #apply links. */
export function isFranchiseApplyHref(href: string | undefined): boolean {
  if (!href?.trim()) return false;
  return normalizeHref(href) === "apply";
}

function isFranchiseApplyNavLink(link: { label: string; href: string }): boolean {
  if (isFranchiseApplyHref(link.href)) return true;
  const label = link.label.trim().toLowerCase();
  return label.includes("franchise") || label === "apply";
}

function withoutFranchiseSecondaryCtas<T extends { secondaryCtaLabel?: string; secondaryCtaHref?: string }>(
  section: T
): T {
  const { secondaryCtaLabel: _label, secondaryCtaHref: _href, ...rest } = section;
  return rest as T;
}

/** Center public sites use "Book a free trial" — not Enroll nav items or brand franchise apply CTAs. */
export function sanitizeCenterPublicNavConfig(config: HomepageConfig): HomepageConfig {
  return {
    ...config,
    nav: {
      ...withoutFranchiseSecondaryCtas(config.nav),
      links: config.nav.links.filter((link) => !isEnrollNavLink(link) && !isFranchiseApplyNavLink(link)),
    },
    hero: withoutFranchiseSecondaryCtas(config.hero),
  };
}
