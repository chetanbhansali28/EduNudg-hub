import { describe, expect, it } from "vitest";
import { centerMatchesSearch, normalizePhoneDigits } from "./centerCentersApi";

describe("centerCentersApi", () => {
  const center = {
    id: "c1",
    slug: "koramangala",
    name: "Koramangala Center",
    display_name: "Abacus Koramangala",
    status: "active" as const,
    city: "Bengaluru",
    region: null,
    pincode: "560034",
    contact_phone: "+91 98765 43210",
    address_line1: null,
    short_description: null,
    country: "IN",
    photo_url: null,
    social_links: [],
  };

  it("normalizePhoneDigits strips non-digits", () => {
    expect(normalizePhoneDigits("+91 98765 43210")).toBe("919876543210");
  });

  it("centerMatchesSearch matches name", () => {
    expect(centerMatchesSearch(center, "koramangala")).toBe(true);
    expect(centerMatchesSearch(center, "Abacus")).toBe(true);
  });

  it("centerMatchesSearch matches phone digits", () => {
    expect(centerMatchesSearch(center, "98765")).toBe(true);
    expect(centerMatchesSearch(center, "919876543210")).toBe(true);
  });

  it("centerMatchesSearch empty query matches all", () => {
    expect(centerMatchesSearch(center, "")).toBe(true);
    expect(centerMatchesSearch(center, "   ")).toBe(true);
  });
});
