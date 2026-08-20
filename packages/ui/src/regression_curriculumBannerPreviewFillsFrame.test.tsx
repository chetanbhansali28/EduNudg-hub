import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
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
});
