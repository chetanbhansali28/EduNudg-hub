import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BRAND_ASSETS_BUCKET,
  brandLogoObjectPath,
  brandLogoPublicUrl,
  removeExistingBrandLogos,
} from "./brandLogoStorage";

const listMock = vi.fn();
const removeMock = vi.fn();
const getPublicUrlMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    storage: {
      from: () => ({
        list: listMock,
        remove: removeMock,
        getPublicUrl: getPublicUrlMock,
      }),
    },
  }),
}));

describe("brandLogoStorage", () => {
  beforeEach(() => {
    listMock.mockReset();
    removeMock.mockReset();
    getPublicUrlMock.mockReset();
    getPublicUrlMock.mockReturnValue({ data: { publicUrl: "https://cdn/logo.png" } });
  });

  it("brandLogoObjectPath uses brand id folder", () => {
    expect(brandLogoObjectPath("uuid-1", "png")).toBe("uuid-1/logo.png");
  });

  it("brandLogoPublicUrl reads from brand-assets bucket", () => {
    brandLogoPublicUrl("uuid-1", "webp");
    expect(getPublicUrlMock).toHaveBeenCalledWith("uuid-1/logo.webp");
  });

  it("removeExistingBrandLogos deletes prior logo files", async () => {
    listMock.mockResolvedValue({
      data: [{ name: "logo.png" }, { name: "readme.txt" }],
      error: null,
    });
    removeMock.mockResolvedValue({ error: null });

    await removeExistingBrandLogos("uuid-1");

    expect(listMock).toHaveBeenCalledWith("uuid-1");
    expect(removeMock).toHaveBeenCalledWith(["uuid-1/logo.png"]);
  });

  it("uses brand-assets bucket constant", () => {
    expect(BRAND_ASSETS_BUCKET).toBe("brand-assets");
  });
});
