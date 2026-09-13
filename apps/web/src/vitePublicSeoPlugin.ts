import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import { handlePublicSeoDiscovery } from "./lib/publicSeoHandlers";

function requestFromNode(req: { url?: string; headers: { host?: string } }, origin: string): Request {
  const path = req.url ?? "/";
  return new Request(new URL(path, origin), {
    headers: { host: req.headers.host ?? new URL(origin).host },
  });
}

function attachDiscovery(
  middlewares: { use: (fn: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void },
  httpsEnabled: boolean | undefined
) {
  middlewares.use(async (req, res, next) => {
    const path = (req.url ?? "/").split("?")[0] ?? "/";
    const origin = `${httpsEnabled ? "https" : "http"}://${req.headers.host ?? "localhost:9000"}`;
    try {
      if (path === "/robots.txt") {
        const response = await handlePublicSeoDiscovery(requestFromNode(req, origin), "robots");
        res.statusCode = response.status;
        res.setHeader("content-type", "text/plain; charset=utf-8");
        res.end(await response.text());
        return;
      }
      if (path === "/sitemap.xml") {
        const response = await handlePublicSeoDiscovery(requestFromNode(req, origin), "sitemap");
        res.statusCode = response.status;
        res.setHeader("content-type", "application/xml; charset=utf-8");
        res.end(await response.text());
        return;
      }
      if (path === "/llms.txt") {
        const response = await handlePublicSeoDiscovery(requestFromNode(req, origin), "llms");
        res.statusCode = response.status;
        res.setHeader("content-type", "text/plain; charset=utf-8");
        res.end(await response.text());
        return;
      }
      if (path === "/.well-known/ai.txt") {
        const response = await handlePublicSeoDiscovery(requestFromNode(req, origin), "ai");
        res.statusCode = response.status;
        res.setHeader("content-type", "text/plain; charset=utf-8");
        res.end(await response.text());
        return;
      }
    } catch {
      next();
      return;
    }
    next();
  });
}

/** Dev/preview: serve robots/sitemap/llms. HTML injection stays on Vercel (`/api/seo-document`). */
export function publicSeoDevPlugin(): Plugin {
  return {
    name: "edunudg-public-seo",
    configureServer(server) {
      attachDiscovery(server.middlewares, Boolean(server.config.server.https));
    },
    configurePreviewServer(server) {
      attachDiscovery(server.middlewares, Boolean(server.config.preview.https));
    },
  };
}
