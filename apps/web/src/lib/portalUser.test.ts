import { describe, expect, it } from "vitest";
import { displayUserFromAuth } from "./portalUser";

describe("displayUserFromAuth", () => {
  it("uses full_name from metadata", () => {
    const result = displayUserFromAuth({
      id: "1",
      email: "admin@edunudg.com",
      user_metadata: { full_name: "Platform Admin" },
      app_metadata: {},
      aud: "authenticated",
      created_at: "",
    });
    expect(result.name).toBe("Platform Admin");
    expect(result.email).toBe("admin@edunudg.com");
  });

  it("falls back to email local part", () => {
    const result = displayUserFromAuth({
      id: "1",
      email: "center.owner@example.com",
      user_metadata: {},
      app_metadata: {},
      aud: "authenticated",
      created_at: "",
    });
    expect(result.name).toBe("Center owner");
  });
});
