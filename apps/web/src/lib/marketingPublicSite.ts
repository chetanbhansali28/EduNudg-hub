import type { HomepageConfig } from "@/types/homepage";

const CURRICULUM_NAV = { label: "Curriculum", href: "#curriculum" } as const;

/** Show curriculum nav only when public programs exist; hide when empty. */
export function applyCurriculumNavLink(
  config: HomepageConfig,
  hasCurriculum: boolean
): HomepageConfig {
  const links = config.nav.links.filter((l) => l.href !== CURRICULUM_NAV.href);
  if (!hasCurriculum) {
    return { ...config, nav: { ...config.nav, links } };
  }

  const featuresIdx = links.findIndex((l) => l.href === "#features");
  const insertAt = featuresIdx >= 0 ? featuresIdx + 1 : 0;
  const next = [...links.slice(0, insertAt), CURRICULUM_NAV, ...links.slice(insertAt)];
  return { ...config, nav: { ...config.nav, links: next } };
}

export function applyCanonicalSiteName(config: HomepageConfig, siteName: string): HomepageConfig {
  return {
    ...config,
    meta: { ...config.meta, siteName },
  };
}
