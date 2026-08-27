import { describe, expect, it } from "vitest";
import { sanitizeClientErrorMetadata, sanitizeClientErrorText } from "./clientErrorApi";

describe("clientErrorApi", () => {
  it("regression_client_error_strips_tokens_and_jwts", () => {
    const jwt =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4ifQ.signaturepartlong";
    expect(sanitizeClientErrorText(`boom ${jwt}`, 500)).toBe("boom [redacted]");
    expect(sanitizeClientErrorMetadata({ password: "secret", token: "x", route: "/app" })).toEqual({
      route: "/app",
    });
  });
});
