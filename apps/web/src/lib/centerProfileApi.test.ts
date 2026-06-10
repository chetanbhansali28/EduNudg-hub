import { beforeEach, describe, expect, it, vi } from "vitest";
import { centerProfileToPayload, updateCenterPublicProfile } from "./centerProfileApi";

const rpc = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ rpc }),
}));

describe("centerProfileApi", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it("centerProfileToPayload maps social links for RPC", () => {
    const payload = centerProfileToPayload({
      displayName: "Koramangala Center",
      shortDescription: "South Bengaluru",
      addressLine1: "12 Main Road",
      city: "Bengaluru",
      region: "KA",
      pincode: "560034",
      country: "IN",
      contactPhone: "+919876543210",
      photoUrl: "https://cdn/photo.jpg",
      socialLinks: [{ platform: "Instagram", url: "https://instagram.com/center" }],
    });

    expect(payload).toMatchObject({
      display_name: "Koramangala Center",
      social_links: [{ platform: "Instagram", url: "https://instagram.com/center" }],
    });
    expect(payload).not.toHaveProperty("contact_email");
    expect(payload).not.toHaveProperty("website_url");
  });

  it("regression_updateCenterPublicProfile_calls_rpc", async () => {
    rpc.mockResolvedValue({ error: null });
    await updateCenterPublicProfile("center-1", {
      displayName: "Center",
      shortDescription: "",
      addressLine1: "",
      city: "",
      region: "",
      pincode: "",
      country: "IN",
      contactPhone: "",
      photoUrl: "",
      socialLinks: [],
    });
    expect(rpc).toHaveBeenCalledWith("update_center_public_profile_rpc", {
      p_center_id: "center-1",
      p_payload: expect.objectContaining({ country: "IN" }),
    });
  });
});
