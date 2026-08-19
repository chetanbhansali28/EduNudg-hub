import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { GallerySection } from "./GallerySection";
import { sparkGalleryMarqueeDurationSec, sparkGalleryMarqueeLoop } from "./galleryHelpers";

const fourPhotos = {
  title: "Moments from our journey",
  images: [
    { url: "https://cdn.example.com/a.jpg", alt: "Annual day" },
    { url: "https://cdn.example.com/b.jpg", alt: "Classroom" },
    { url: "https://cdn.example.com/c.jpg", alt: "Assembly" },
    { url: "https://cdn.example.com/d.jpg", alt: "Sports day" },
  ],
};

describe("GallerySection", () => {
  it("regression_spark_photo_gallery_renders_homepage_images", () => {
    render(
      <GallerySection
        gallery={{
          title: "Campus moments",
          images: [
            { url: "https://cdn.example.com/a.jpg", alt: "Annual day" },
            { url: "https://cdn.example.com/b.jpg", alt: "Classroom" },
            { url: "  ", alt: "blank" },
          ],
        }}
      />
    );

    expect(document.getElementById("gallery")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Campus moments" })).toBeDefined();
    expect(screen.getByAltText("Annual day")).toBeDefined();
    expect(screen.getByAltText("Classroom")).toBeDefined();
    expect(screen.queryByAltText("blank")).toBeNull();
  });

  it("regression_spark_photo_gallery_hides_when_empty", () => {
    const { container } = render(<GallerySection gallery={{ title: "Photo gallery", images: [] }} />);
    expect(container.firstChild).toBeNull();
  });

  it("regression_spark_gallery_marquee_duplicates_photos_for_loop", () => {
    const { container } = render(<GallerySection gallery={fourPhotos} />);
    const wrap = container.querySelector(".sa-gallery__marquee-wrap");
    expect(wrap?.getAttribute("role")).toBe("region");
    expect(wrap?.getAttribute("aria-roledescription")).toBe("marquee");
    expect(wrap?.getAttribute("aria-label")).toBe("Moments from our journey");
    expect(container.querySelector(".sa-gallery__marquee")).toBeTruthy();
    expect(container.querySelectorAll(".sa-gallery__item")).toHaveLength(8);
    expect(container.querySelector(".sa-gallery__carousel")).toBeNull();
  });
});

describe("gallery marquee helpers", () => {
  it("regression_spark_gallery_marquee_loop_duplicates_when_multiple", () => {
    expect(sparkGalleryMarqueeLoop(["a"]).length).toBe(1);
    expect(sparkGalleryMarqueeLoop(["a", "b", "c"])).toEqual(["a", "b", "c", "a", "b", "c"]);
    expect(sparkGalleryMarqueeDurationSec(1)).toBe(0);
    expect(sparkGalleryMarqueeDurationSec(6)).toBe(36);
  });
});

describe("Spark gallery marquee CSS", () => {
  const css = readFileSync(resolve(__dirname, "spark-academy.css"), "utf8");

  it("regression_spark_gallery_marquee_css_scrolls_all_photos", () => {
    expect(css).toMatch(/\.sa-gallery__marquee\s*\{[^}]*display:\s*flex/s);
    expect(css).toMatch(/\.sa-gallery__marquee\s*\{[^}]*animation:\s*sa-gallery-marquee/s);
    expect(css).toMatch(/@keyframes sa-gallery-marquee[\s\S]*translateX\(-50%\)/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.sa-gallery__marquee\s*\{[^}]*animation:\s*none/s);
    expect(css).not.toMatch(/grid-template-rows:\s*repeat\(2/);
  });
});
