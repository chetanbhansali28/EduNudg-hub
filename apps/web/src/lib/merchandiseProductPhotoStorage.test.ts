import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  merchandiseProductPhotoFolder,
  merchandiseProductPhotoObjectPath,
  normalizeMerchandisePhotoUrls,
  removeExistingMerchandiseProductPhotoSlot,
  uploadMerchandiseProductPhoto,
} from "./merchandiseProductPhotoStorage";

const listMock = vi.fn();
const removeMock = vi.fn();
const uploadMock = vi.fn();
const getPublicUrlMock = vi.fn();
const singleMock = vi.fn();
const updateChainMock = vi.fn();
let updateEqCalls = 0;

function buildSelectChain() {
  const chain: { eq: ReturnType<typeof vi.fn>; single: typeof singleMock } = {
    eq: vi.fn(() => chain),
    single: singleMock,
  };
  return chain;
}

const selectChain = buildSelectChain();

function buildUpdateChain() {
  updateEqCalls = 0;
  const chain = {
    eq: vi.fn(() => {
      updateEqCalls += 1;
      return updateEqCalls >= 2 ? Promise.resolve({ error: null }) : chain;
    }),
  };
  return chain;
}

let updateChain = buildUpdateChain();
updateChainMock.mockImplementation(() => updateChain);

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
      select: vi.fn(() => selectChain),
      update: updateChainMock,
    }),
  }),
}));

vi.mock("@/lib/brandLogoCache", () => ({
  withLogoCacheBust: (url: string) => `${url}?v=1`,
}));

describe("merchandiseProductPhotoStorage", () => {
  beforeEach(() => {
    listMock.mockReset();
    removeMock.mockReset();
    uploadMock.mockReset();
    getPublicUrlMock.mockReset();
    singleMock.mockReset();
    updateChainMock.mockReset();
    updateChain = buildUpdateChain();
    updateChainMock.mockImplementation(() => updateChain);

    listMock.mockResolvedValue({ data: [], error: null });
    removeMock.mockResolvedValue({ error: null });
    uploadMock.mockResolvedValue({ error: null });
    getPublicUrlMock.mockReturnValue({ data: { publicUrl: "https://cdn/photo.jpg" } });
    singleMock.mockResolvedValue({ data: { photo_urls: ["", "", "", "", ""] }, error: null });
  });

  it("merchandiseProductPhotoObjectPath uses consistent slot naming", () => {
    expect(merchandiseProductPhotoFolder("brand-1", "item-1")).toBe("brand-1/merchandise/item-1");
    expect(merchandiseProductPhotoObjectPath("brand-1", "item-1", 3, "webp")).toBe(
      "brand-1/merchandise/item-1/photo-3.webp"
    );
  });

  it("normalizeMerchandisePhotoUrls pads to five slots", () => {
    expect(normalizeMerchandisePhotoUrls(["a"])).toEqual(["a", "", "", "", ""]);
  });

  it("removeExistingMerchandiseProductPhotoSlot deletes same-slot files only", async () => {
    listMock.mockResolvedValue({
      data: [{ name: "photo-2.png" }, { name: "photo-2.jpg" }, { name: "photo-3.png" }],
      error: null,
    });

    await removeExistingMerchandiseProductPhotoSlot("brand-1", "item-1", 2);

    expect(removeMock).toHaveBeenCalledWith([
      "brand-1/merchandise/item-1/photo-2.png",
      "brand-1/merchandise/item-1/photo-2.jpg",
    ]);
  });

  it("regression_uploadMerchandiseProductPhoto_replaces_slot_and_updates_catalog", async () => {
    const file = new File(["x"], "shot.png", { type: "image/png" });
    const urls = await uploadMerchandiseProductPhoto("brand-1", "item-1", 2, file);

    expect(uploadMock).toHaveBeenCalledWith(
      "brand-1/merchandise/item-1/photo-2.png",
      file,
      expect.objectContaining({ upsert: true })
    );
    expect(urls[1]).toBe("https://cdn/photo.jpg?v=1");
    expect(updateChainMock).toHaveBeenCalledWith({ photo_urls: expect.any(Array) });
  });
});
