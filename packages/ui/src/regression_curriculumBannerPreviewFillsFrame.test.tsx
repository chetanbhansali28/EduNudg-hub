import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CurriculumBannerDropzone } from "./curriculum";

describe("curriculum banner dropzone", () => {
  const css = readFileSync(resolve(__dirname, "./styles.css"), "utf8");

  it("regression_curriculum_banner_preview_fills_frame_without_side_gaps", () => {
    const { container } = render(
      <MemoryRouter>
        <CurriculumBannerDropzone imageUrl="https://cdn.example/banner.jpg" onUploadClick={() => undefined} />
      </MemoryRouter>
    );

    expect(container.querySelector(".ed-curriculum-banner-dropzone--filled")).toBeTruthy();
    expect(css).toMatch(/\.ed-curriculum-banner-dropzone--filled\s*\{[^}]*padding:\s*0/s);
    expect(css).toMatch(/\.ed-curriculum-banner-dropzone__image\s*\{[^}]*width:\s*100%/s);
    expect(css).toMatch(/\.ed-curriculum-banner-dropzone__image\s*\{[^}]*height:\s*auto/s);
    expect(css).toMatch(/\.ed-curriculum-banner-dropzone__image\s*\{[^}]*max-height:\s*none/s);
    expect(css).not.toMatch(/\.ed-curriculum-banner-dropzone__image\s*\{[^}]*max-height:\s*10rem/s);
  });

  it("regression_curriculum_banner_always_shows_upload_action", () => {
    const { rerender, getByRole } = render(
      <MemoryRouter>
        <CurriculumBannerDropzone imageUrl="" onUploadClick={() => undefined} hint="PNG, JPEG, WebP, or GIF." />
      </MemoryRouter>,
    );

    expect(getByRole("button", { name: "Upload image" })).toBeTruthy();
    expect(getByRole("button", { name: "Upload course banner" })).toBeTruthy();
    expect(getByRole("button", { name: "Upload course banner" }).textContent).toMatch(/click to upload/i);

    rerender(
      <MemoryRouter>
        <CurriculumBannerDropzone
          imageUrl="https://cdn.example/banner.jpg"
          onUploadClick={() => undefined}
          hint="PNG, JPEG, WebP, or GIF."
        />
      </MemoryRouter>,
    );

    expect(getByRole("button", { name: "Replace image" })).toBeTruthy();
    expect(getByRole("button", { name: "Replace course banner" })).toBeTruthy();
  });

  it("regression_curriculum_banner_shows_upload_when_saved_image_fails", () => {
    const { container, getByRole } = render(
      <MemoryRouter>
        <CurriculumBannerDropzone
          imageUrl="https://cdn.example/missing-banner.jpg"
          onUploadClick={() => undefined}
          hint="PNG, JPEG, WebP, or GIF."
        />
      </MemoryRouter>,
    );

    const img = container.querySelector(".ed-curriculum-banner-dropzone__image") as HTMLImageElement;
    fireEvent.error(img);

    expect(getByRole("button", { name: "Upload image" })).toBeTruthy();
    expect(getByRole("button", { name: "Upload course banner" }).textContent).toMatch(/click to upload/i);
    expect(container.querySelector(".ed-curriculum-banner-dropzone--filled")).toBeNull();
  });
});
