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

/** Converts common YouTube watch/share URLs to embed URL. */
export function toYoutubeEmbedUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1).split("/")[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch") {
        const id = parsed.searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      const embedMatch = parsed.pathname.match(/^\/embed\/([^/?]+)/);
      if (embedMatch?.[1]) return `https://www.youtube.com/embed/${embedMatch[1]}`;
      const shortsMatch = parsed.pathname.match(/^\/shorts\/([^/?]+)/);
      if (shortsMatch?.[1]) return `https://www.youtube.com/embed/${shortsMatch[1]}`;
    }
  } catch {
    return null;
  }

  return null;
}
