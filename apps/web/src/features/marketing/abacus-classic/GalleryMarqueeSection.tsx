import type { HomepageGallery } from "@/types/homepage";

type Props = {
  gallery: HomepageGallery;
};

export function GalleryMarqueeSection({ gallery }: Props) {
  if (gallery.images.length === 0) return null;

  const loop = [...gallery.images, ...gallery.images];

  return (
    <section className="ac-gallery" id="gallery">
      {gallery.title ? <h2 className="ac-gallery__title">{gallery.title}</h2> : null}
      <div className="ac-gallery__marquee-wrap">
        <div className="ac-gallery__marquee">
          {loop.map((image, i) => (
            <figure key={`${image.url}-${i}`} className="ac-gallery__item">
              <img src={image.url} alt={image.alt ?? ""} loading="lazy" />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
