import { afterEach, describe, expect, it } from "vitest";
import {
  centerSlugFromFranchiseReferrer,
  resolveLearnLoginCenterSlug,
} from "./learnLoginChrome";

describe("learnLoginChrome", () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it("parses franchise center from a center-host referrer", () => {
    expect(
      centerSlugFromFranchiseReferrer(
        "http://rathi-educom.digitley-pune.localhost:9000/",
        "digitley-pune"
      )
    ).toBe("rathi-educom");
  });

  it("ignores learn and brand referrers", () => {
    expect(
      centerSlugFromFranchiseReferrer("http://learn.digitley-pune.localhost:9000/login", "digitley-pune")
    ).toBeNull();
    expect(
      centerSlugFromFranchiseReferrer("http://digitley-pune.localhost:9000/", "digitley-pune")
    ).toBeNull();
  });

  it("regression_learn_login_remembers_franchise_center_from_query", () => {
    expect(
      resolveLearnLoginCenterSlug({
        brandSlug: "digitley-pune",
        queryCenter: "rathi-educom",
        referrer: "",
      })
    ).toBe("rathi-educom");
    expect(
      resolveLearnLoginCenterSlug({
        brandSlug: "digitley-pune",
        queryCenter: null,
        referrer: "",
      })
    ).toBe("rathi-educom");
  });
});
