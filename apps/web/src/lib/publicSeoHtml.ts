import type { PublicSeoSnapshot } from "./publicSeo";

export const PUBLIC_SEO_HEAD_MARK = "<!--edunudg-public-seo-->";

export function publicSeoHeadMarkup(seo: PublicSeoSnapshot): string {
  const tags = [
    `<title>${escapeHtml(seo.title)}</title>`,
    `<meta name="description" content="${escapeAttr(seo.description)}" />`,
    `<meta name="robots" content="${escapeAttr(seo.robots)}" />`,
    `<link rel="canonical" href="${escapeAttr(seo.canonicalUrl)}" />`,
    `<meta property="og:type" content="${escapeAttr(seo.ogType)}" />`,
    `<meta property="og:title" content="${escapeAttr(seo.ogTitle)}" />`,
    `<meta property="og:description" content="${escapeAttr(seo.ogDescription)}" />`,
    `<meta property="og:url" content="${escapeAttr(seo.canonicalUrl)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeAttr(seo.ogTitle)}" />`,
    `<meta name="twitter:description" content="${escapeAttr(seo.ogDescription)}" />`,
  ];
  if (seo.ogImageUrl) {
    tags.push(`<meta property="og:image" content="${escapeAttr(seo.ogImageUrl)}" />`);
    tags.push(`<meta name="twitter:image" content="${escapeAttr(seo.ogImageUrl)}" />`);
  }
  for (const node of seo.jsonLd) {
    tags.push(`<script type="application/ld+json">${escapeJsonLd(node)}</script>`);
  }
  return tags.join("\n    ");
}

export function injectPublicSeoHead(html: string, seo: PublicSeoSnapshot): string {
  const markup = publicSeoHeadMarkup(seo);
  if (html.includes(PUBLIC_SEO_HEAD_MARK)) {
    return html.replace(PUBLIC_SEO_HEAD_MARK, markup);
  }
  const withoutTitle = html.replace(/<title>[\s\S]*?<\/title>/i, "");
  if (withoutTitle.includes("</head>")) {
    return withoutTitle.replace("</head>", `    ${markup}\n  </head>`);
  }
  return `${html}\n${markup}`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

function escapeJsonLd(node: Record<string, unknown>): string {
  return JSON.stringify(node).replace(/</g, "\\u003c");
}
