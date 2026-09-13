import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("publicSeo vercel rewrites", () => {
  it("regression_vercel_rewrites_do_not_swallow_robots_sitemap_llms", () => {
    const json = JSON.parse(readFileSync(resolve(__dirname, "../../vercel.json"), "utf8")) as {
      rewrites: Array<{ source: string; destination: string }>;
    };
    const sources = json.rewrites.map((row) => row.source);
    const destinations = json.rewrites.map((row) => row.destination);
    expect(sources[0]).toBe("/robots.txt");
    expect(destinations[0]).toContain("/api/public-seo");
    expect(sources).toContain("/sitemap.xml");
    expect(sources).toContain("/llms.txt");
    expect(sources).toContain("/.well-known/ai.txt");
    const catchAllIndex = json.rewrites.findIndex((row) => row.source.includes("(?!api/"));
    const robotsIndex = json.rewrites.findIndex((row) => row.source === "/robots.txt");
    expect(robotsIndex).toBeGreaterThanOrEqual(0);
    expect(catchAllIndex).toBeGreaterThan(robotsIndex);
    expect(json.rewrites[catchAllIndex]?.destination).toBe("/api/seo-document");
  });
});
