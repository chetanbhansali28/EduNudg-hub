import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BRAND_ASSETS_BUCKET,
  brandLogoObjectPath,
  brandLogoPublicUrl,
  removeExistingBrandLogos,
  uploadBrandLogo,
} from "./brandLogoStorage";

const listMock = vi.fn();
const removeMock = vi.fn();
const uploadMock = vi.fn();
const updateMock = vi.fn();
const eqMock = vi.fn();
const getPublicUrlMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    storage: {
      from: () => ({
        list: listMock,
        remove: removeMock,
        upload: uploadMock,
        getPublicUrl: getPublicUrlMock,
      }),
    },
    from: () => ({
      update: updateMock.mockReturnValue({ eq: eqMock }),
    }),
  }),
}));

vi.mock("@/lib/brandLogoCache", () => ({
  withLogoCacheBust: (url: string) => `${url}?v=123`,
}));

describe("brandLogoStorage", () => {
  beforeEach(() => {
    listMock.mockReset();
    removeMock.mockReset();
    uploadMock.mockReset();
    updateMock.mockReset();
    eqMock.mockReset();
    getPublicUrlMock.mockReset();
    getPublicUrlMock.mockReturnValue({ data: { publicUrl: "https://cdn/logo.png" } });
    listMock.mockResolvedValue({ data: [], error: null });
    uploadMock.mockResolvedValue({ error: null });
    eqMock.mockResolvedValue({ error: null });
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

  it("regression_uploadBrandLogo_stores_cache_busted_logo_url", async () => {
    const file = new File(["x"], "logo.png", { type: "image/png" });
    const url = await uploadBrandLogo("uuid-1", file);
    expect(url).toBe("https://cdn/logo.png?v=123");
    expect(uploadMock).toHaveBeenCalledWith(
      "uuid-1/logo.png",
      file,
      expect.objectContaining({ cacheControl: "300", upsert: true })
    );
    expect(updateMock).toHaveBeenCalledWith({ logo_url: "https://cdn/logo.png?v=123" });
  });
});
