import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { GallerySection } from "./GallerySection";

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
});
