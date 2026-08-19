import type { HomepageGallery } from "@/types/homepage";
import { sparkGalleryMarqueeDurationSec, sparkGalleryMarqueeLoop } from "./galleryHelpers";

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
  const loop = sparkGalleryMarqueeLoop(photos);
  const duration = sparkGalleryMarqueeDurationSec(photos.length);
  const marquee = photos.length > 1;

  return (
    <section className="sa-gallery sa-reveal" id="gallery">
      <div className="sa-section-head sa-section-head--center sa-reveal-item">
        <h2 className="sa-section-title">{title}</h2>
      </div>
      <div
        className="sa-gallery__marquee-wrap"
        role="region"
        aria-roledescription="marquee"
        aria-label={title}
      >
        <div
          className={`sa-gallery__marquee${marquee ? "" : " sa-gallery__marquee--static"}`}
          style={marquee ? { animationDuration: `${duration}s` } : undefined}
        >
          {loop.map((image, index) => {
            const duplicate = marquee && index >= photos.length;
            return (
              <figure
                key={`${image.url}-${index}`}
                className="sa-gallery__item"
                aria-hidden={duplicate ? true : undefined}
              >
                <img src={image.url} alt={duplicate ? "" : (image.alt ?? "")} loading="lazy" />
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
