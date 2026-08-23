import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { uploadMarketingMedia } from "@/lib/marketingMediaStorage";
import { CourseFields, EMPTY_COURSE_FORM } from "@/features/brand/curriculum/curriculumForms";

vi.mock("@/lib/marketingMediaStorage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/marketingMediaStorage")>();
  return {
    ...actual,
    uploadMarketingMedia: vi.fn(async () => "https://cdn.example/new.png"),
  };
});

function fileInput(container: HTMLElement) {
  return container.querySelector<HTMLInputElement>('input[type="file"]')!;
}

describe("curriculum program media slots", () => {
  it("regression_curriculum_course_banner_upload_does_not_share_brand_slot", async () => {
    const onChangeA = vi.fn();
    const onChangeB = vi.fn();
    const { rerender, container } = render(
      <CourseFields brandId="brand-1" mediaSlotId="course-a" value={EMPTY_COURSE_FORM} onChange={onChangeA} />,
    );

    const fileA = new File(["a"], "a.png", { type: "image/png" });
    fireEvent.change(fileInput(container), { target: { files: [fileA] } });
    await waitFor(() => expect(uploadMarketingMedia).toHaveBeenCalledTimes(1));
    expect(uploadMarketingMedia).toHaveBeenCalledWith(
      { kind: "brand", brandId: "brand-1" },
      "program-marketing/course-a",
      fileA,
    );

    rerender(
      <CourseFields brandId="brand-1" mediaSlotId="course-b" value={EMPTY_COURSE_FORM} onChange={onChangeB} />,
    );
    const fileB = new File(["b"], "b.png", { type: "image/png" });
    fireEvent.change(fileInput(container), { target: { files: [fileB] } });
    await waitFor(() => expect(uploadMarketingMedia).toHaveBeenCalledTimes(2));
    expect(uploadMarketingMedia).toHaveBeenLastCalledWith(
      { kind: "brand", brandId: "brand-1" },
      "program-marketing/course-b",
      fileB,
    );
  });
});
