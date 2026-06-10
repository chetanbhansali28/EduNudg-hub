import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MerchandiseProductPhotos } from "./MerchandiseProductPhotos";

const uploadMock = vi.fn();
const clearMock = vi.fn();

vi.mock("@/lib/merchandiseProductPhotoStorage", () => ({
  MERCHANDISE_PHOTO_MAX_SLOTS: 5,
  activeMerchandisePhotoUrls: (urls: string[]) => urls.filter((u) => u.trim()),
  normalizeMerchandisePhotoUrls: (urls?: string[] | null) => {
    const padded = [...(urls ?? [])];
    while (padded.length < 5) padded.push("");
    return padded.slice(0, 5);
  },
  uploadMerchandiseProductPhoto: (...args: unknown[]) => uploadMock(...args),
  clearMerchandiseProductPhoto: (...args: unknown[]) => clearMock(...args),
}));

describe("MerchandiseProductPhotos", () => {
  it("regression_brand_merchandise_photo_upload_calls_storage_for_slot", async () => {
    uploadMock.mockResolvedValue(["https://cdn/photo-2.jpg", "", "", "", ""]);
    const onChange = vi.fn();

    render(
      <MerchandiseProductPhotos
        brandId="brand-1"
        catalogItemId="item-1"
        photoUrls={[]}
        onChange={onChange}
      />
    );

    const inputs = document.querySelectorAll('input[type="file"]');
    const file = new File(["x"], "shot.png", { type: "image/png" });
    fireEvent.change(inputs[1]!, { target: { files: [file] } });

    await waitFor(() => {
      expect(uploadMock).toHaveBeenCalledWith("brand-1", "item-1", 2, file);
      expect(onChange).toHaveBeenCalled();
    });
  });

  it("shows five photo slots", () => {
    render(
      <MerchandiseProductPhotos
        brandId="brand-1"
        catalogItemId="item-1"
        photoUrls={["https://cdn/a.jpg"]}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText("Photo 1")).toBeDefined();
    expect(screen.getByText("Photo 5")).toBeDefined();
    expect(screen.getByText(/Product photos \(1\/5\)/)).toBeDefined();
  });
});
