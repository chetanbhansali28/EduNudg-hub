import type { HomepageConfig } from "@/types/homepage";

function isEnrollNavLink(link: { label: string; href: string }): boolean {
  return link.label.trim().toLowerCase() === "enroll";
}

/** Center public sites use "Book a free trial" — not a separate Enroll nav item. */
export function sanitizeCenterPublicNavConfig(config: HomepageConfig): HomepageConfig {
  return {
    ...config,
    nav: {
      ...config.nav,
      links: config.nav.links.filter((link) => !isEnrollNavLink(link)),
    },
  };
}
