import { useEffect } from "react";
import type { PublicSeoSnapshot } from "@/lib/publicSeo";

const DEFAULT_TITLE = "EduNudg";
export const PUBLIC_SEO_NODE_ATTR = "data-edunudg-seo";

function clearSeoNodes() {
  document.querySelectorAll(`[${PUBLIC_SEO_NODE_ATTR}]`).forEach((node) => node.remove());
}

function mark(el: HTMLElement) {
  el.setAttribute(PUBLIC_SEO_NODE_ATTR, "");
  return el;
}

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`;
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(mark(el));
  } else {
    mark(el);
  }
  el.content = content;
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(mark(el));
  } else {
    mark(el);
  }
  el.href = href;
}

export function applyPublicSeoSnapshot(seo: PublicSeoSnapshot) {
  document.title = seo.title || DEFAULT_TITLE;
  upsertMeta("name", "description", seo.description);
  upsertMeta("name", "robots", seo.robots);
  upsertLink("canonical", seo.canonicalUrl);
  upsertMeta("property", "og:type", seo.ogType);
  upsertMeta("property", "og:title", seo.ogTitle);
  upsertMeta("property", "og:description", seo.ogDescription);
  upsertMeta("property", "og:url", seo.canonicalUrl);
  upsertMeta("name", "twitter:card", "summary_large_image");
  upsertMeta("name", "twitter:title", seo.ogTitle);
  upsertMeta("name", "twitter:description", seo.ogDescription);
  if (seo.ogImageUrl) {
    upsertMeta("property", "og:image", seo.ogImageUrl);
    upsertMeta("name", "twitter:image", seo.ogImageUrl);
  }
  document.querySelectorAll(`script[type="application/ld+json"][${PUBLIC_SEO_NODE_ATTR}]`).forEach((node) => node.remove());
  for (const node of seo.jsonLd) {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(node);
    document.head.appendChild(mark(script));
  }
}

export function usePublicDocumentHead(seo: PublicSeoSnapshot | null) {
  useEffect(() => {
    if (!seo) return;
    applyPublicSeoSnapshot(seo);
    return () => {
      clearSeoNodes();
      document.title = DEFAULT_TITLE;
    };
  }, [seo]);
}

export function usePageMeta(title: string, description?: string) {
  usePublicDocumentHead({
    pageKind: "other",
    title: title ? `${title} · ${DEFAULT_TITLE}` : DEFAULT_TITLE,
    description: description ?? "",
    canonicalUrl: typeof window !== "undefined" ? window.location.href : "",
    robots: "noindex, nofollow",
    indexable: false,
    ogTitle: title || DEFAULT_TITLE,
    ogDescription: description ?? "",
    ogImageUrl: null,
    ogType: "website",
    jsonLd: [],
  });
}
