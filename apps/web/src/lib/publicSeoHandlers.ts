import { deriveRequestPublicSeo, resolveSeoTenant, sitemapInputFromRequest } from "@/lib/publicSeoRequest";
import { buildAiTxt, buildLlmsTxt, buildRobotsTxt, buildSitemapXml, isPublicDiscoveryPath } from "@/lib/publicSeoDiscovery";
import { injectPublicSeoHead } from "@/lib/publicSeoHtml";
import { loadPublicSeoPageDataRemote, readPublicSeoEnv } from "@/lib/publicSeoRemote";

export function requestHost(req: Request): string {
  const url = new URL(req.url);
  const forwarded = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? url.host;
  return forwarded.split(",")[0]?.trim() || url.host;
}

export function requestProtocol(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-proto");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "https";
  return new URL(req.url).protocol.replace(":", "") || "https";
}

async function pageArgs(req: Request, pathname: string) {
  const env = readPublicSeoEnv();
  const host = requestHost(req);
  const search = new URL(req.url).search;
  const tenant = resolveSeoTenant(host, search);
  const data = await loadPublicSeoPageDataRemote(env, tenant.portal, tenant.brandSlug, tenant.centerSlug);
  return {
    hostname: host,
    pathname,
    search,
    protocol: requestProtocol(req),
    portalBaseDomain: env.portalBaseDomain,
    vercelEnv: env.vercelEnv,
    ...data,
  };
}

export async function handlePublicSeoDiscovery(req: Request, file: string): Promise<Response> {
  const url = new URL(req.url);
  const kind = file || isPublicDiscoveryPath(url.pathname) || "";
  const args = await pageArgs(req, "/");
  const sitemapInput = sitemapInputFromRequest(args);
  if (kind === "robots") {
    return new Response(buildRobotsTxt(sitemapInput), {
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=300" },
    });
  }
  if (kind === "sitemap") {
    return new Response(buildSitemapXml(sitemapInput), {
      headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=300" },
    });
  }
  if (kind === "llms") {
    return new Response(buildLlmsTxt(sitemapInput), {
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=300" },
    });
  }
  if (kind === "ai") {
    return new Response(buildAiTxt(sitemapInput), {
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=300" },
    });
  }
  return new Response("Not found", { status: 404 });
}

export async function handleSeoDocument(req: Request, html: string): Promise<Response> {
  const url = new URL(req.url);
  const args = await pageArgs(req, url.pathname);
  const seo = deriveRequestPublicSeo(args);
  return new Response(injectPublicSeoHead(html, seo), {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300" },
  });
}
