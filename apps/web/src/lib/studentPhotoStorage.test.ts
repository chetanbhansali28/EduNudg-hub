import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  removeExistingStudentPhotos,
  studentPhotoObjectPath,
  uploadStudentPhoto,
} from "./studentPhotoStorage";

const listMock = vi.fn();
const removeMock = vi.fn();
const uploadMock = vi.fn();
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
  }),
}));

vi.mock("@/lib/brandLogoCache", () => ({
  withLogoCacheBust: (url: string) => `${url}?v=1`,
}));

describe("studentPhotoStorage", () => {
  beforeEach(() => {
    listMock.mockReset();
    removeMock.mockReset();
    uploadMock.mockReset();
    getPublicUrlMock.mockReset();
    listMock.mockResolvedValue({ data: [], error: null });
    removeMock.mockResolvedValue({ error: null });
    uploadMock.mockResolvedValue({ error: null });
    getPublicUrlMock.mockReturnValue({ data: { publicUrl: "https://cdn/student.jpg" } });
  });

  it("studentPhotoObjectPath uses brand-assets students folder", () => {
    expect(studentPhotoObjectPath("brand-1", "student-1", "jpg")).toBe(
      "brand-1/students/student-1/photo.jpg"
    );
  });

  it("removeExistingStudentPhotos deletes photo files only", async () => {
    listMock.mockResolvedValue({
      data: [{ name: "photo.png" }, { name: "notes.txt" }],
      error: null,
    });
    await removeExistingStudentPhotos("brand-1", "student-1");
    expect(removeMock).toHaveBeenCalledWith(["brand-1/students/student-1/photo.png"]);
  });

  it("regression_uploadStudentPhoto_replaces_prior_photo", async () => {
    const file = new File(["x"], "student.png", { type: "image/png" });
    const url = await uploadStudentPhoto("brand-1", "student-1", file);
    expect(url).toBe("https://cdn/student.jpg?v=1");
    expect(uploadMock).toHaveBeenCalledWith(
      "brand-1/students/student-1/photo.png",
      file,
      expect.objectContaining({ upsert: true })
    );
  });
});
