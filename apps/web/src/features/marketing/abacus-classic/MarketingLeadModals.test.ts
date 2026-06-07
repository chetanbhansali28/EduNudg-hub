import { describe, expect, it } from "vitest";
import { resolveLeadModalKind } from "@/features/marketing/abacus-classic/MarketingLeadModals";

describe("resolveLeadModalKind", () => {
  it("maps enroll and apply hrefs", () => {
    expect(resolveLeadModalKind("enroll")).toBe("enroll");
    expect(resolveLeadModalKind("#apply")).toBe("apply");
  });

  it("returns null for regular links", () => {
    expect(resolveLeadModalKind("#faq")).toBeNull();
  });
});
