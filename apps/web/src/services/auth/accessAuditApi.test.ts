import { describe, expect, it } from "vitest";
import { sanitizeAccessAuditMetadata } from "./accessAuditApi";

describe("accessAuditApi", () => {
  it("regression_access_audit_metadata_omits_secrets", () => {
    expect(
      sanitizeAccessAuditMetadata({
        password: "secret",
        access_token: "tok",
        format: "xlsx",
      })
    ).toEqual({ format: "xlsx" });
  });
});
