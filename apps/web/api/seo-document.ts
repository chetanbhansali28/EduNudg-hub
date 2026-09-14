import {
  SPA_HTML_HEADERS,
  toWebRequest,
  writeWebResponse,
  type NodeLikeReq,
  type NodeLikeRes,
} from "../src/lib/publicSeoVercelAdapter";

export const config = { runtime: "nodejs" };

const FALLBACK_HTML =
  `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>EduNudg</title></head><body><div id="root"></div></body></html>`;

async function loadIndexHtml(req: Request): Promise<string> {
  const url = new URL(req.url);
  const indexUrl = new URL("/index.html", `${url.protocol}//${url.host}`);
  const res = await fetch(indexUrl, { headers: { accept: "text/html" } });
  if (!res.ok) return FALLBACK_HTML;
  return res.text();
}

export default async function handler(req: Request | NodeLikeReq, res?: NodeLikeRes): Promise<Response | void> {
  const webReq = toWebRequest(req);
  let html = FALLBACK_HTML;
  try {
    html = await loadIndexHtml(webReq);
  } catch {
    html = FALLBACK_HTML;
  }
  try {
    const { handleSeoDocument } = await import("../src/lib/publicSeoHandlers");
    return await writeWebResponse(res, await handleSeoDocument(webReq, html));
  } catch {
    return writeWebResponse(res, new Response(html, { headers: SPA_HTML_HEADERS }));
  }
}
