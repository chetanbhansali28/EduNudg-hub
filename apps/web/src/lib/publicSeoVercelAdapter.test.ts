import { describe, expect, it } from "vitest";
import { toWebRequest } from "./publicSeoVercelAdapter";

describe("publicSeo vercel adapter", () => {
  it("regression_vercel_seo_api_accepts_node_request_path", () => {
    const req = toWebRequest({
      url: "/login",
      method: "GET",
      headers: { host: "edunudg-hub.vercel.app", "x-forwarded-proto": "https" },
    });
    const url = new URL(req.url);
    expect(url.pathname).toBe("/login");
    expect(url.host).toBe("edunudg-hub.vercel.app");
    expect(url.protocol).toBe("https:");
  });

  it("regression_vercel_seo_api_keeps_absolute_web_request", () => {
    const incoming = new Request("https://edunudg-hub.vercel.app/robots.txt?file=robots");
    const req = toWebRequest(incoming);
    expect(new URL(req.url).pathname).toBe("/robots.txt");
  });
});
