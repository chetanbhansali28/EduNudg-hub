import { describe, expect, it, vi } from "vitest";
import {
  formatCenterDisplayId,
  googleMapsSearchUrl,
  joinIndiaPhone,
  sendOwnerPasswordReset,
  splitIndiaPhone,
} from "./centerSettingsHelpers";

const resetPasswordForEmail = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    auth: { resetPasswordForEmail },
  }),
}));

describe("centerSettingsHelpers", () => {
  it("formatCenterDisplayId builds a readable center code", () => {
    expect(formatCenterDisplayId("abacusworld", "koramangala", "a1b2c3d4-e5f6-7890-abcd-ef1234567890")).toMatch(
      /^AB-KOR-[A-F0-9]{3}$/
    );
  });

  it("splitIndiaPhone and joinIndiaPhone round-trip national numbers", () => {
    expect(splitIndiaPhone("+919876543210")).toBe("9876543210");
    expect(joinIndiaPhone("9876543210")).toBe("+919876543210");
  });

  it("googleMapsSearchUrl encodes address parts", () => {
    const url = googleMapsSearchUrl({
      addressLine1: "78, 4th Block",
      city: "Bengaluru",
      region: "Karnataka",
      pincode: "560034",
    });
    expect(url).toContain("google.com/maps/search");
    expect(url).toContain("Bengaluru");
  });

  it("regression_sendOwnerPasswordReset_calls_supabase", async () => {
    resetPasswordForEmail.mockResolvedValue({ error: null });
    await sendOwnerPasswordReset("owner@example.com");
    expect(resetPasswordForEmail).toHaveBeenCalledWith("owner@example.com", {
      redirectTo: expect.stringContaining("/login"),
    });
  });
});
