import type { Plugin, ViteDevServer } from "vite";

function requestFromNode(req: { url?: string; headers: { host?: string } }, origin: string): Request {
  const path = req.url ?? "/";
  return new Request(new URL(path, origin), {
    headers: { host: req.headers.host ?? new URL(origin).host },
  });
}

function discoveryFile(pathname: string): "robots" | "sitemap" | "llms" | "ai" | null {
  if (pathname === "/robots.txt") return "robots";
  if (pathname === "/sitemap.xml") return "sitemap";
  if (pathname === "/llms.txt") return "llms";
  if (pathname === "/.well-known/ai.txt") return "ai";
  return null;
}

function attachDiscovery(server: ViteDevServer, httpsEnabled: boolean) {
  server.middlewares.use(async (req, res, next) => {
    const path = (req.url ?? "/").split("?")[0] ?? "/";
    const file = discoveryFile(path);
    if (!file) {
      next();
      return;
    }
    const origin = `${httpsEnabled ? "https" : "http"}://${req.headers.host ?? "localhost:9000"}`;
    try {
      const mod = (await server.ssrLoadModule("/src/lib/publicSeoHandlers.ts")) as {
        handlePublicSeoDiscovery: (req: Request, file: string) => Promise<Response>;
      };
      const response = await mod.handlePublicSeoDiscovery(requestFromNode(req, origin), file);
      res.statusCode = response.status;
      res.setHeader("content-type", response.headers.get("content-type") ?? "text/plain; charset=utf-8");
      res.end(await response.text());
    } catch {
      next();
    }
  });
}

/** Dev/preview: serve robots/sitemap/llms. Do not statically import `@/` — that breaks `vite build`. */
export function publicSeoDevPlugin(): Plugin {
  return {
    name: "edunudg-public-seo",
    configureServer(server) {
      attachDiscovery(server, Boolean(server.config.server.https));
    },
    configurePreviewServer(server) {
      if (typeof (server as ViteDevServer).ssrLoadModule !== "function") return;
      attachDiscovery(server as ViteDevServer, Boolean(server.config.preview.https));
    },
  };
}
