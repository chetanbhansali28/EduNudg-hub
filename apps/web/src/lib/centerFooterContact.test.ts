import { describe, expect, it } from "vitest";
import {
  centerFooterContactFromProfile,
  centerPhoneHref,
  formatCenterLocationLine,
} from "./centerFooterContact";

const base = {
  addressLine1: "Flat no 1 Shanti pushp app",
  city: "Chh.Sambhaji nagar",
  region: "Maharastra",
  pincode: "431001",
  contactPhone: "+918806232153",
};

describe("centerFooterContactFromProfile", () => {
  it("regression_center_footer_contact_uses_franchise_profile_not_brand_hq", () => {
    expect(centerFooterContactFromProfile(base)).toEqual({
      addressLines: ["Flat no 1 Shanti pushp app", "Chh.Sambhaji nagar · Maharastra · 431001"],
      phone: "+918806232153",
    });
  });

  it("returns null when no address or phone is saved", () => {
    expect(
      centerFooterContactFromProfile({
        addressLine1: null,
        city: null,
        region: null,
        pincode: null,
        contactPhone: "  ",
      })
    ).toBeNull();
  });

  it("keeps phone-only and address-only profiles", () => {
    expect(
      centerFooterContactFromProfile({
        ...base,
        addressLine1: null,
        city: null,
        region: null,
        pincode: null,
      })
    ).toEqual({ addressLines: [], phone: "+918806232153" });
    expect(
      centerFooterContactFromProfile({
        ...base,
        contactPhone: null,
        city: null,
        region: null,
        pincode: null,
      })
    ).toEqual({ addressLines: ["Flat no 1 Shanti pushp app"], phone: null });
  });
});

describe("formatCenterLocationLine", () => {
  it("joins city region pincode", () => {
    expect(formatCenterLocationLine(base)).toBe("Chh.Sambhaji nagar · Maharastra · 431001");
  });
});

describe("centerPhoneHref", () => {
  it("builds a tel link", () => {
    expect(centerPhoneHref("+91 88062 32153")).toBe("tel:+918806232153");
  });
});
