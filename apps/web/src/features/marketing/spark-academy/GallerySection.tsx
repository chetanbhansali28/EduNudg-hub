import { useRef } from "react";
import type { HomepageGallery } from "@/types/homepage";
import { galleryColumnCount } from "./galleryHelpers";
import { useSparkGalleryCarousel } from "./useSparkGalleryCarousel";

type Props = {
  gallery: HomepageGallery;
};

export function galleryPhotos(gallery: HomepageGallery) {
  return gallery.images.filter((image) => Boolean(image.url?.trim()));
}

export function GallerySection({ gallery }: Props) {
  const photos = galleryPhotos(gallery);
  if (photos.length === 0) return null;

  const title = gallery.title?.trim() || "Photo gallery";
  const trackRef = useRef<HTMLDivElement>(null);
  useSparkGalleryCarousel(trackRef, galleryColumnCount(photos.length));

  return (
    <section className="sa-gallery sa-reveal" id="gallery">
      <div className="sa-section-head sa-section-head--center sa-reveal-item">
        <h2 className="sa-section-title">{title}</h2>
      </div>
      <div
        ref={trackRef}
        className="sa-gallery__track sa-gallery__carousel"
        role="region"
        aria-roledescription="carousel"
        aria-label={title}
      >
        {photos.map((image, index) => (
          <figure key={`${image.url}-${index}`} className="sa-gallery__item sa-reveal-item">
            <img src={image.url} alt={image.alt ?? ""} loading="lazy" />
          </figure>
        ))}
      </div>
    </section>
  );
}
