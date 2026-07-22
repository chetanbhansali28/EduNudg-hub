import { describe, expect, it } from "vitest";
import { appendPortalHandoffToken, portalHandoffCallbackUrl } from "./portalHandoffUrl";

describe("portalHandoffUrl", () => {
  it("critical_builds_handoff_callback_on_target_host", () => {
    expect(portalHandoffCallbackUrl("http://smart-brain-abacus.localhost:9000", "/app")).toBe(
      "http://smart-brain-abacus.localhost:9000/auth/handoff?next=%2Fapp"
    );
  });

  it("critical_appends_token_hash_without_supabase_site_url_redirect", () => {
    expect(
      appendPortalHandoffToken(
        "http://smart-brain-abacus.localhost:9000/auth/handoff?next=%2Fapp",
        "abc123token"
      )
    ).toBe("http://smart-brain-abacus.localhost:9000/auth/handoff?token_hash=abc123token&next=%2Fapp");
  });

  it("regression_preserves_same_origin_portal_query_when_appending_token", () => {
    expect(
      appendPortalHandoffToken(
        "https://edunudg-hub.vercel.app/auth/handoff?portal=brand&brand=demo&next=%2Fapp",
        "tok"
      )
    ).toBe(
      "https://edunudg-hub.vercel.app/auth/handoff?token_hash=tok&next=%2Fapp&portal=brand&brand=demo"
    );
  });
});
