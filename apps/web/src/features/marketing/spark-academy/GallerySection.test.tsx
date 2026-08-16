import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { GallerySection } from "./GallerySection";
import {
  SPARK_GALLERY_AUTOSCROLL_MS,
  galleryColumnCount,
  nextGalleryColumnIndex,
  shouldAutoScrollGallery,
} from "./galleryHelpers";

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
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

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

  it("regression_spark_gallery_mobile_carousel_markup", () => {
    const { container } = render(<GallerySection gallery={fourPhotos} />);
    const track = container.querySelector(".sa-gallery__carousel");
    expect(track).toBeDefined();
    expect(track?.getAttribute("role")).toBe("region");
    expect(track?.getAttribute("aria-roledescription")).toBe("carousel");
    expect(track?.getAttribute("aria-label")).toBe("Moments from our journey");
    expect(container.querySelectorAll(".sa-gallery__item")).toHaveLength(4);
    expect(container.querySelector(".sa-gallery__column")).toBeNull();
  });

  it("regression_spark_gallery_mobile_autoscroll_advances", () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("767px"),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
    );

    const { container } = render(<GallerySection gallery={fourPhotos} />);
    const track = container.querySelector(".sa-gallery__carousel") as HTMLElement;
    const scrollTo = vi.fn();
    track.scrollTo = scrollTo;

    vi.advanceTimersByTime(SPARK_GALLERY_AUTOSCROLL_MS);
    expect(scrollTo).toHaveBeenCalled();
  });
});

describe("gallery carousel helpers", () => {
  it("regression_spark_gallery_pairs_photos_into_two_row_columns", () => {
    expect(galleryColumnCount(4)).toBe(2);
    expect(galleryColumnCount(3)).toBe(2);
    expect(galleryColumnCount(1)).toBe(1);
    expect(nextGalleryColumnIndex(0, 3)).toBe(1);
    expect(nextGalleryColumnIndex(2, 3)).toBe(0);
  });

  it("regression_spark_gallery_auto_scroll_skips_reduced_motion", () => {
    expect(
      shouldAutoScrollGallery({ isMobile: true, prefersReducedMotion: true, columnCount: 3 })
    ).toBe(false);
    expect(
      shouldAutoScrollGallery({ isMobile: false, prefersReducedMotion: false, columnCount: 3 })
    ).toBe(false);
    expect(
      shouldAutoScrollGallery({ isMobile: true, prefersReducedMotion: false, columnCount: 1 })
    ).toBe(false);
    expect(
      shouldAutoScrollGallery({ isMobile: true, prefersReducedMotion: false, columnCount: 3 })
    ).toBe(true);
  });
});

describe("Spark gallery carousel CSS", () => {
  const css = readFileSync(resolve(__dirname, "spark-academy.css"), "utf8");

  it("regression_spark_gallery_mobile_carousel_css", () => {
    expect(css).toMatch(/@media \(max-width: 767px\)/);
    expect(css).toMatch(/\.sa-gallery__carousel\s*\{[^}]*grid-template-rows:\s*repeat\(2/s);
    expect(css).toMatch(/\.sa-gallery__carousel\s*\{[^}]*grid-auto-flow:\s*column/s);
    expect(css).toMatch(/\.sa-gallery__carousel\s*\{[^}]*scroll-snap-type:\s*x mandatory/s);
    expect(css).toMatch(/@media \(min-width: 1024px\)[\s\S]*?\.sa-gallery__track\s*\{[^}]*grid-template-columns:\s*repeat\(4/s);
  });
});
