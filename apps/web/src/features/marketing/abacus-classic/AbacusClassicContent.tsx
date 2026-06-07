import type { HomepageConfig } from "@/types/homepage";
import type { PublicCurriculumProgram } from "@/lib/brandCurriculumPublic";
import { isAbacusSectionEnabled } from "@/lib/homepageSections";
import { TestimonialsCarousel } from "../TestimonialsCarousel";
import { AbacusClassicHero } from "./AbacusClassicHero";
import { ProgramsMarqueeSection } from "./ProgramsMarqueeSection";
import { FeatureGridSection } from "./FeatureGridSection";
import { FoundersSection } from "./FoundersSection";
import { TrustMediaSection } from "./TrustMediaSection";
import { GalleryMarqueeSection } from "./GalleryMarqueeSection";

function FaqList({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <div className="ac-faq__list">
      {items.map((item) => (
        <details key={item.question} className="ac-faq__item">
          <summary>{item.question}</summary>
          <p>{item.answer}</p>
        </details>
      ))}
    </div>
  );
}

type Props = {
  config: HomepageConfig;
  publicCurriculum: PublicCurriculumProgram[];
};

export function AbacusClassicContent({ config, publicCurriculum }: Props) {
  const showHero = isAbacusSectionEnabled(config, "hero");
  const showPrograms = isAbacusSectionEnabled(config, "programsMarquee");
  const showFeatures = isAbacusSectionEnabled(config, "featureGrid") && config.featureSections.length > 0;
  const showFounders = isAbacusSectionEnabled(config, "founders") && (config.founders?.length ?? 0) > 0;
  const showTrust = isAbacusSectionEnabled(config, "trustMedia") && config.trustMedia;
  const showTestimonials = isAbacusSectionEnabled(config, "testimonials");
  const showFaq = isAbacusSectionEnabled(config, "faq") && config.faq.length > 0;
  const showGallery = isAbacusSectionEnabled(config, "gallery") && (config.gallery?.images.length ?? 0) > 0;

  return (
    <main className="ac-main">
      {showHero ? <AbacusClassicHero config={config} /> : null}
      {showPrograms ? <ProgramsMarqueeSection programs={publicCurriculum} /> : null}
      {showFeatures ? <FeatureGridSection siteName={config.meta.siteName} sections={config.featureSections} /> : null}
      {showFounders && config.founders ? <FoundersSection founders={config.founders} /> : null}
      {showTrust && config.trustMedia ? <TrustMediaSection trust={config.trustMedia} /> : null}
      {showTestimonials ? <TestimonialsCarousel testimonials={config.testimonials} /> : null}
      {showFaq ? (
        <section className="ac-faq" id="faq">
          <h2 className="ac-section-heading">Got questions?</h2>
          <FaqList items={config.faq} />
        </section>
      ) : null}
      {showGallery && config.gallery ? <GalleryMarqueeSection gallery={config.gallery} /> : null}
    </main>
  );
}
