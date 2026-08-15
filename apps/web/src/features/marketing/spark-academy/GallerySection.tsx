import type { HomepageGallery } from "@/types/homepage";

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

  return (
    <section className="sa-gallery" id="gallery">
      <div className="sa-section-head sa-section-head--center">
        <h2 className="sa-section-title">{title}</h2>
      </div>
      <div className="sa-gallery__grid">
        {photos.map((image, index) => (
          <figure key={`${image.url}-${index}`} className="sa-gallery__item">
            <img src={image.url} alt={image.alt ?? ""} loading="lazy" />
          </figure>
        ))}
      </div>
    </section>
  );
}
