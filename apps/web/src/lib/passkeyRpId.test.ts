import { describe, expect, it } from "vitest";
import { passkeyOrigin, resolvePasskeyRpId } from "./passkeyRpId";

describe("passkeyRpId", () => {
  it("resolves localhost subdomains to localhost rpId", () => {
    expect(resolvePasskeyRpId("abacusworld.localhost")).toBe("localhost");
    expect(resolvePasskeyRpId("koramangala.abacusworld.localhost")).toBe("localhost");
    expect(resolvePasskeyRpId("localhost")).toBe("localhost");
  });

  it("uses hostname for production hosts", () => {
    expect(resolvePasskeyRpId("edunudg-hub.vercel.app")).toBe("edunudg-hub.vercel.app");
    expect(resolvePasskeyRpId("admin.edunudg.com")).toBe("admin.edunudg.com");
  });

  it("passkeyOrigin returns window origin in browser", () => {
    expect(passkeyOrigin()).toBe("http://localhost:3000");
  });
});
