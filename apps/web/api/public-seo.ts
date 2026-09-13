import { handlePublicSeoDiscovery } from "../src/lib/publicSeoHandlers";

export const config = { runtime: "nodejs" };

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const file = url.searchParams.get("file") ?? "";
  return handlePublicSeoDiscovery(req, file);
}
