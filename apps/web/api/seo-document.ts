import { handleSeoDocument } from "../src/lib/publicSeoHandlers";

export const config = { runtime: "nodejs" };

async function loadIndexHtml(req: Request): Promise<string> {
  const url = new URL(req.url);
  const indexUrl = new URL("/index.html", `${url.protocol}//${url.host}`);
  const res = await fetch(indexUrl, { headers: { accept: "text/html" } });
  if (!res.ok) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>EduNudg</title></head><body><div id="root"></div></body></html>`;
  }
  return res.text();
}

export default async function handler(req: Request): Promise<Response> {
  const html = await loadIndexHtml(req);
  return handleSeoDocument(req, html);
}
