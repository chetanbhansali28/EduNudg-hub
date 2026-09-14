import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("publicSeo vite plugin", () => {
  it("regression_vite_seo_plugin_does_not_statically_import_app_aliases", () => {
    const plugin = readFileSync(resolve(__dirname, "../vitePublicSeoPlugin.ts"), "utf8");
    expect(plugin).not.toMatch(/from\s+["']@\//);
    expect(plugin).not.toMatch(/from\s+["']\.\/lib\/publicSeo/);
    expect(plugin).toContain("ssrLoadModule");
  });
});

describe("publicSeo vercel rewrites", () => {
  const json = JSON.parse(readFileSync(resolve(__dirname, "../../vercel.json"), "utf8")) as {
    rewrites: Array<{ source: string; destination: string }>;
  };

  it("regression_vercel_rewrites_do_not_swallow_robots_sitemap_llms", () => {
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
    expect(json.rewrites[catchAllIndex]?.destination).toBe("/index.html");
  });

  it("regression_vercel_login_is_not_rewritten_to_seo_document", () => {
    const loginRewrite = json.rewrites.find((row) => row.source === "/login");
    expect(loginRewrite).toBeUndefined();
    const catchAll = json.rewrites.find((row) => row.source.includes("(?!api/"));
    expect(catchAll?.destination).toBe("/index.html");
    expect(catchAll?.destination).not.toBe("/api/seo-document");
    const htmlDestinations = json.rewrites.filter((row) => row.destination === "/api/seo-document").map((row) => row.source);
    expect(htmlDestinations).toEqual(["/", "/about", "/courses/:slug", "/legal/:kind"]);
    expect(htmlDestinations).not.toContain("/login");
    expect(htmlDestinations).not.toContain("/favicon.ico");
    expect(htmlDestinations).not.toContain("/app");
  });
});

describe("publicSeo vercel function graph", () => {
  it("regression_vercel_seo_handlers_do_not_import_app_aliases", () => {
    const handlers = readFileSync(resolve(__dirname, "./publicSeoHandlers.ts"), "utf8");
    const courseSlug = readFileSync(resolve(__dirname, "./publicCourseSlug.ts"), "utf8");
    const seo = readFileSync(resolve(__dirname, "./publicSeo.ts"), "utf8");
    expect(handlers).not.toMatch(/from\s+["']@\//);
    expect(courseSlug).not.toMatch(/from\s+["']@\//);
    expect(courseSlug).not.toMatch(/from\s+["'].*brandSlug["']/);
    expect(seo).not.toMatch(/from\s+["']@\//);
  });
});
