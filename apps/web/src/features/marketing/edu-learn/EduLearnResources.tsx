import type { HomepageGallery } from "@/types/homepage";
import { EduLearnCta, EduLearnMark } from "./EduLearnCta";

type Props = {
  gallery: HomepageGallery;
  ctaHref: string;
};

export function galleryPhotos(gallery: HomepageGallery) {
  return gallery.images.filter((image) => Boolean(image.url?.trim()));
}

export function EduLearnResources({ gallery, ctaHref }: Props) {
  const photos = galleryPhotos(gallery).slice(0, 3);
  if (photos.length === 0) return null;
  const title = gallery.title?.trim() || "Useful content for your center";

  return (
    <section className="el-section" id="gallery">
      <div className="el-section-inner">
        <div className="el-section-head">
          <h2>
            {/content|resource/i.test(title) ? (
              title
            ) : (
              <>
                Useful content <EduLearnMark>for your center</EduLearnMark>
              </>
            )}
          </h2>
        </div>
        <div className="el-resources__grid">
          {photos.map((image, index) => (
            <article key={`${image.url}-${index}`} className="el-resource-card">
              <img src={image.url} alt={image.alt ?? ""} />
              <div className="el-resource-card__body">
                <h3>{image.alt?.trim() || `Learning story ${index + 1}`}</h3>
                <EduLearnCta label="Read more" href={ctaHref} icon />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
