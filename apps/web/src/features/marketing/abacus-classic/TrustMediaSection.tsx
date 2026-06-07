import type { HomepageTrustMedia } from "@/types/homepage";
import { toYoutubeEmbedUrl } from "@/lib/marketingPublicSite";

type Props = {
  trust: HomepageTrustMedia;
};

export function TrustMediaSection({ trust }: Props) {
  const embedUrl = toYoutubeEmbedUrl(trust.youtubeUrl);

  return (
    <section className="ac-trust" id="trust">
      <div className="ac-trust__inner">
        <div className="ac-trust__video">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title="Brand video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="ac-trust__video-placeholder">
              <p>Add a YouTube link in the brand homepage editor.</p>
            </div>
          )}
        </div>
        <div className="ac-trust__copy">
          {trust.eyebrow ? <p className="ac-trust__eyebrow">{trust.eyebrow}</p> : null}
          <h2>
            {trust.title}{" "}
            {trust.titleHighlight ? <span className="ac-trust__highlight">{trust.titleHighlight}</span> : null}
          </h2>
          <p className="ac-trust__intro">{trust.intro}</p>
          <div className="ac-trust__cards">
            {trust.cards.map((card, i) => (
              <article
                key={`${card.title}-${i}`}
                className="ac-trust__card"
                style={card.accentColor ? { borderLeftColor: card.accentColor } : undefined}
              >
                <h3>{card.title}</h3>
                <p>{card.subtitle}</p>
              </article>
            ))}
          </div>
          {trust.ctaLabel && trust.ctaHref ? (
            <a href={trust.ctaHref} className="ac-btn ac-btn--dark">
              {trust.ctaLabel}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
