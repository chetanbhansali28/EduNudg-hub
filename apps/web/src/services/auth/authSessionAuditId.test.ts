import { describe, expect, it } from "vitest";
import { authSessionAuditId } from "./authSessionAuditId";

function jwtWithPayload(payload: Record<string, unknown>): string {
  const json = btoa(JSON.stringify(payload)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `hdr.${json}.sig`;
}

describe("authSessionAuditId", () => {
  it("regression_auth_session_id_prefers_gotrue_session_id", () => {
    const token = jwtWithPayload({ session_id: "sess-abc", iat: 1, sub: "user-1" });
    expect(authSessionAuditId(token, "user-1")).toBe("sess-abc");
  });

  it("falls back to user and iat when session_id is missing", () => {
    const token = jwtWithPayload({ iat: 99, sub: "user-1" });
    expect(authSessionAuditId(token, "user-1")).toBe("user-1:99");
  });

  it("falls back to user id when token is missing", () => {
    expect(authSessionAuditId(undefined, "user-1")).toBe("user-1");
  });
});
