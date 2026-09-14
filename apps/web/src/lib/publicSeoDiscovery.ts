import {
  buildCanonicalUrl,
  classifyPublicPath,
  preferredPublicOrigin,
  type PublicSeoInput,
  type PublicSeoPortal,
} from "./publicSeo";
import { BRAND_LEGAL_PAGE_KINDS, type BrandLegalPageKind } from "./brandLegalPages";

export const PUBLIC_SEO_AI_CRAWLERS = ["GPTBot", "ChatGPT-User", "PerplexityBot", "ClaudeBot", "Google-Extended"] as const;

export type PublicSitemapInput = PublicSeoInput & {
  coursePaths?: string[];
  publishedLegalKinds?: BrandLegalPageKind[];
};

export function buildRobotsTxt(input: Pick<PublicSeoInput, "requestOrigin" | "portal" | "brandSlug" | "centerSlug" | "portalBaseDomain" | "preferredHostname" | "isPreview">): string {
  const origin = preferredPublicOrigin({
    portal: input.portal,
    requestOrigin: input.requestOrigin,
    portalBaseDomain: input.portalBaseDomain,
    brandSlug: input.brandSlug,
    centerSlug: input.centerSlug,
    preferredHostname: input.preferredHostname,
  });
  const lines = [
    "User-agent: *",
    input.isPreview ? "Disallow: /" : "Allow: /",
    "Disallow: /app",
    "Disallow: /admin",
    "Disallow: /login",
    "Disallow: /auth/",
    "",
  ];
  if (!input.isPreview) {
    for (const bot of PUBLIC_SEO_AI_CRAWLERS) {
      lines.push(`User-agent: ${bot}`, "Allow: /", "");
    }
    lines.push(`Sitemap: ${origin}/sitemap.xml`);
  }
  return `${lines.join("\n")}\n`;
}

export function sitemapPathsForPortal(input: PublicSitemapInput): string[] {
  const portal = input.portal;
  if (portal === "learn" || portal === "parents") return [];
  const paths = new Set<string>(["/"]);
  const legal = input.publishedLegalKinds ?? BRAND_LEGAL_PAGE_KINDS;
  for (const kind of legal) {
    paths.add(`/legal/${kind}`);
  }
  if (portal === "brand" && input.aboutPublished) {
    paths.add("/about");
  }
  for (const coursePath of input.coursePaths ?? []) {
    if (coursePath.startsWith("/courses/") && !coursePath.includes("#")) {
      paths.add(coursePath);
    }
  }
  return [...paths];
}

export function buildSitemapXml(input: PublicSitemapInput): string {
  const urls = sitemapPathsForPortal(input)
    .filter((path) => {
      if (path === "/login" || path.includes("#")) return false;
      if (path === "/about" && !input.aboutPublished) return false;
      const kind = classifyPublicPath(path, input.portal);
      return kind === "home" || kind === "about" || kind === "course" || kind === "legal";
    })
    .map((path) => {
      const loc = escapeXml(buildCanonicalUrl({ ...input, pathname: path }, path));
      return `  <url><loc>${loc}</loc></url>`;
    });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

export function buildLlmsTxt(input: PublicSitemapInput): string {
  const origin = preferredPublicOrigin(input);
  const site = input.siteName.trim() || "EduNudg";
  const lines = [
    `# ${site}`,
    "",
    `> ${input.heroSubtitle?.trim() || `${site} public learning programs.`}`,
    "",
    `Canonical: ${buildCanonicalUrl({ ...input, pathname: "/" }, "/")}`,
    "",
  ];
  if (input.portal === "center" && input.center) {
    lines.push("## Location", "");
    const bits = [input.center.name, input.center.addressLine1, input.center.city, input.center.region, input.center.pincode]
      .map((part) => part?.trim())
      .filter(Boolean);
    lines.push(bits.join(", "));
    if (input.center.phone) lines.push(`Phone: ${input.center.phone}`);
    lines.push("");
  }
  const courses = input.coursePaths ?? [];
  if (courses.length > 0) {
    lines.push("## Courses", "");
    for (const path of courses) {
      lines.push(`- ${origin}${path}`);
    }
    lines.push("");
  }
  lines.push("## Cite this site", "");
  lines.push(`Use ${origin} as the source for ${site} programs, franchise locations, and public course pages.`);
  lines.push("");
  return lines.join("\n");
}

export function buildAiTxt(input: Pick<PublicSeoInput, "requestOrigin" | "portal" | "brandSlug" | "centerSlug" | "portalBaseDomain" | "preferredHostname">): string {
  const origin = preferredPublicOrigin(input);
  return `llms.txt: ${origin}/llms.txt\n`;
}

export function isPublicDiscoveryPath(pathname: string): "robots" | "sitemap" | "llms" | "ai" | null {
  const path = pathname.split("?")[0] ?? "";
  if (path === "/robots.txt") return "robots";
  if (path === "/sitemap.xml") return "sitemap";
  if (path === "/llms.txt") return "llms";
  if (path === "/.well-known/ai.txt") return "ai";
  return null;
}

export function shouldInjectSeoDocument(pathname: string, portal: PublicSeoPortal): boolean {
  if (isPublicDiscoveryPath(pathname)) return false;
  if (/\.[a-zA-Z0-9]+$/.test(pathname) && !pathname.endsWith(".html")) return false;
  if (pathname.startsWith("/api/") || pathname.startsWith("/assets/") || pathname.startsWith("/src/")) return false;
  return true;
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
