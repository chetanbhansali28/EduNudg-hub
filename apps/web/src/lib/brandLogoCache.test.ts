import { describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { invalidateBrandLogoCaches, stripLogoCacheBust, withLogoCacheBust } from "./brandLogoCache";

describe("brandLogoCache", () => {
  it("withLogoCacheBust appends version query param", () => {
    expect(withLogoCacheBust("https://cdn.example/logo.png", 123)).toBe(
      "https://cdn.example/logo.png?v=123"
    );
  });

  it("stripLogoCacheBust removes prior version before re-busting", () => {
    expect(withLogoCacheBust("https://cdn.example/logo.png?v=1", 2)).toBe(
      "https://cdn.example/logo.png?v=2"
    );
  });

  it("invalidateBrandLogoCaches clears logo-related query keys", () => {
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, "invalidateQueries");
    invalidateBrandLogoCaches(qc, "brand-1");
    expect(spy).toHaveBeenCalledWith({ queryKey: ["brand-landing"] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ["portal-branding"] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ["center-landing"] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ["brand-row", "brand-1"] });
  });
});

describe("stripLogoCacheBust", () => {
  it("returns base url without v param", () => {
    expect(stripLogoCacheBust("https://cdn.example/logo.webp?v=999")).toBe("https://cdn.example/logo.webp");
  });
});
