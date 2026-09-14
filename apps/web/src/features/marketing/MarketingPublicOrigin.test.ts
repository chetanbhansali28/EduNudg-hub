import { describe, expect, it } from "vitest";
import { marketingHrefWithPublicOrigin } from "./MarketingPublicOrigin";

describe("marketingHrefWithPublicOrigin", () => {
  it("prefixes franchise origin onto site-relative and hash links", () => {
    expect(marketingHrefWithPublicOrigin("/#programs", "http://rathi-educom.digitley-pune.localhost:9000")).toBe(
      "http://rathi-educom.digitley-pune.localhost:9000/#programs"
    );
    expect(marketingHrefWithPublicOrigin("#enroll", "http://rathi-educom.digitley-pune.localhost:9000/")).toBe(
      "http://rathi-educom.digitley-pune.localhost:9000/#enroll"
    );
    expect(marketingHrefWithPublicOrigin("/about", null)).toBe("/about");
  });
});
