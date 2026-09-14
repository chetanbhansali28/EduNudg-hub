/** Node IncomingMessage / VercelRequest helpers. Do not import `@/` from this file. */

export type NodeLikeReq = {
  url?: string;
  method?: string;
  headers: Record<string, string | string[] | undefined>;
};

export type NodeLikeRes = {
  statusCode: number;
  setHeader: (name: string, value: string) => void;
  end: (body?: string | Buffer) => void;
};

function headerValue(headers: NodeLikeReq["headers"], name: string): string {
  const raw = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(raw)) return raw[0] ?? "";
  return raw ?? "";
}

function isWebRequest(req: unknown): req is Request {
  return Boolean(req && typeof req === "object" && typeof (req as Request).headers?.get === "function");
}

/** Vercel Node functions pass `/login`, not `https://host/login`. */
export function toWebRequest(req: Request | NodeLikeReq): Request {
  if (isWebRequest(req) && /^https?:\/\//i.test(req.url)) {
    return req;
  }
  const nodeReq = req as NodeLikeReq;
  const host = headerValue(nodeReq.headers, "host") || "localhost";
  const proto = headerValue(nodeReq.headers, "x-forwarded-proto").split(",")[0]?.trim() || "https";
  const rawUrl = nodeReq.url ?? "/";
  const absolute = /^https?:\/\//i.test(rawUrl) ? rawUrl : `${proto}://${host}${rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`}`;
  return new Request(absolute, {
    method: nodeReq.method ?? "GET",
    headers: { host, "x-forwarded-proto": proto },
  });
}

export async function writeWebResponse(res: NodeLikeRes | undefined, response: Response): Promise<Response> {
  if (!res) return response;
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  res.end(Buffer.from(await response.arrayBuffer()));
  return response;
}

export const SPA_HTML_HEADERS = { "content-type": "text/html; charset=utf-8" };
export const PLAIN_TEXT_HEADERS = { "content-type": "text/plain; charset=utf-8" };
