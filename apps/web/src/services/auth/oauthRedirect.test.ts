import { describe, expect, it } from "vitest";
import { buildStaffOAuthRedirectUrl, isOAuthCallbackHash } from "./oauthRedirect";

describe("oauthRedirect", () => {
  it("buildStaffOAuthRedirectUrl targets /login on current origin", () => {
    expect(buildStaffOAuthRedirectUrl("")).toBe("http://localhost:9000/login");
  });

  it("preserves safe next query param", () => {
    expect(buildStaffOAuthRedirectUrl("?next=%2Fadmin")).toBe(
      "http://localhost:9000/login?next=%2Fadmin"
    );
  });

  it("ignores unsafe next values", () => {
    expect(buildStaffOAuthRedirectUrl("?next=https://evil.test")).toBe("http://localhost:9000/login");
  });

  it("detects OAuth callback hash fragments", () => {
    expect(isOAuthCallbackHash("#access_token=abc")).toBe(true);
    expect(isOAuthCallbackHash("#error=access_denied")).toBe(true);
    expect(isOAuthCallbackHash("")).toBe(false);
  });
});
