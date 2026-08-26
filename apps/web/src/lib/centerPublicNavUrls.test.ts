import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { learnPortalLoginUrl } from "./centerPublicNavUrls";

describe("learnPortalLoginUrl", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds learn portal login URL for brand slug", () => {
    vi.stubGlobal("window", {
      location: {
        protocol: "http:",
        hostname: "koramangala.abacusworld.localhost",
        port: "9000",
        origin: "http://koramangala.abacusworld.localhost:9000",
      },
    });
    expect(learnPortalLoginUrl("abacusworld")).toBe(
      "http://learn.abacusworld.localhost:9000/login"
    );
  });

  it("regression_vercel_student_login_uses_path_before_portal_query", () => {
    vi.stubGlobal("window", {
      location: {
        protocol: "https:",
        hostname: "edunudg-hub.vercel.app",
        port: "",
        origin: "https://edunudg-hub.vercel.app",
      },
    });
    const url = learnPortalLoginUrl("smart-brain-abacus");
    expect(url).toBe(
      "https://edunudg-hub.vercel.app/login?portal=learn&brand=smart-brain-abacus"
    );
    expect(url).not.toMatch(/brand=[^&]*\/login/);
  });
});
