import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { learnPortalLoginUrl } from "./centerPublicNavUrls";

describe("learnPortalLoginUrl", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      location: { protocol: "http:", hostname: "koramangala.abacusworld.localhost", port: "9000" },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds learn portal login URL for brand slug", () => {
    expect(learnPortalLoginUrl("abacusworld")).toBe(
      "http://learn.abacusworld.localhost:9000/login"
    );
  });
});
