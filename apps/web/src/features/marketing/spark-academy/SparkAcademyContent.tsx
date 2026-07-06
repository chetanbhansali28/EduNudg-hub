import type { HomepageConfig } from "@/types/homepage";
import type { PortalMode } from "@/lib/portalMode";
import type { CenterPublicProfile } from "@/lib/centerLandingApi";
import type { PublicCurriculumProgram } from "@/lib/brandCurriculumPublic";
import type { BrandPublicStats } from "@/lib/brandLandingBundle";
import { isSparkSectionEnabled } from "@/lib/homepageSections";
import { programsGridHasContent, programsGridToPublicPrograms } from "@/lib/programsGridItems";
import { SparkAcademyHero } from "./SparkAcademyHero";
import { CoursesSection } from "./CoursesSection";
import { FeaturesSection } from "./FeaturesSection";
import { JourneySection } from "./JourneySection";
import { MentorsSection } from "./MentorsSection";
import { TestimonialsSection } from "./TestimonialsSection";
import { FaqSection } from "./FaqSection";

type Props = {
  config: HomepageConfig;
  portalMode: PortalMode;
  brandSlug?: string | null;
  centerSlug?: string | null;
  centerProfile?: CenterPublicProfile | null;
  publicCurriculum?: PublicCurriculumProgram[];
  publicStats?: BrandPublicStats;
};

export function SparkAcademyContent({
  config,
  publicCurriculum = [],
  publicStats = { centersCount: 0, studentsCount: 0 },
}: Props) {
  const showHero = isSparkSectionEnabled(config, "hero");
  const programItems = programsGridToPublicPrograms(config.programsSection, publicCurriculum);
  const showPrograms =
    isSparkSectionEnabled(config, "programsGrid") &&
    programsGridHasContent(config.programsSection, publicCurriculum);
  const showFeatures = isSparkSectionEnabled(config, "featureGrid") && config.featureSections.length > 0;
  const showJourney = isSparkSectionEnabled(config, "trustMedia") && config.trustMedia;
  const showFounders = isSparkSectionEnabled(config, "founders") && (config.founders?.length ?? 0) > 0;
  const showTestimonials = isSparkSectionEnabled(config, "testimonials");
  const showFaq = isSparkSectionEnabled(config, "faq") && config.faq.length > 0;

  const featureImage =
    config.hero.backgroundImageUrl?.trim() ||
    config.gallery?.images[0]?.url?.trim() ||
    config.founders?.[0]?.photoUrl?.trim() ||
    "";

  return (
    <main className="sa-main">
      {showHero ? (
        <SparkAcademyHero
          config={config}
          featuredProgram={publicCurriculum[0] ?? null}
          programCount={publicCurriculum.length}
        />
      ) : null}

      {showPrograms ? (
        <CoursesSection
          programs={programItems}
          ctaHref={config.nav.ctaHref}
          ctaLabel={config.nav.ctaLabel}
        />
      ) : null}

      {showFeatures ? (
        <FeaturesSection sections={config.featureSections} imageUrl={featureImage || undefined} />
      ) : null}

      {showJourney && config.trustMedia ? (
        <JourneySection
          trust={config.trustMedia}
          rich={config.footer.rich}
          highlightFounder={config.founders?.[0] ?? null}
        />
      ) : null}

      {showFounders && config.founders ? <MentorsSection founders={config.founders} /> : null}

      {showTestimonials ? <TestimonialsSection testimonials={config.testimonials} /> : null}

      {showFaq ? <FaqSection items={config.faq} /> : null}
    </main>
  );
}
