import { describe, expect, it } from "vitest";
import { postLoginPath } from "./postLoginPath";

describe("postLoginPath", () => {
  it("sends platform users to /admin", () => {
    expect(postLoginPath({ portalType: "platform" })).toBe("/admin");
  });

  it("sends brand users to /app and center users to portal root", () => {
    expect(postLoginPath({ portalType: "brand" })).toBe("/app");
    expect(postLoginPath({ portalType: "center" })).toBe("/app");
  });
});
